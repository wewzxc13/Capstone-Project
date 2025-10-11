<?php
require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/shape_mapping_helper.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Only POST requests are allowed."]);
    exit;
}
$data = json_decode(file_get_contents('php://input'), true);
$student_id = $data['student_id'] ?? null;
$advisory_id = $data['advisory_id'] ?? null;
if (!$student_id || !$advisory_id) {
    echo json_encode(["status" => "error", "message" => "Missing student_id or advisory_id."]);
    exit;
}

// 1. Check if all 4 quarters have progress cards
$stmt = $conn->prepare('SELECT COUNT(*) as cnt FROM tbl_progress_cards WHERE student_id = ? AND advisory_id = ? AND quarter_id IN (1,2,3,4)');
$stmt->execute([$student_id, $advisory_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row || intval($row['cnt']) < 4) {
    echo json_encode(["status" => "error", "message" => "Not all 4 quarters have progress cards."]);
    exit;
}

// 2. Check if subject overall progress records already exist - if they do, use update instead
$checkStmt = $conn->prepare('SELECT COUNT(*) as cnt FROM tbl_subject_overall_progress WHERE student_id = ? AND advisory_id = ?');
$checkStmt->execute([$student_id, $advisory_id]);
$checkRow = $checkStmt->fetch(PDO::FETCH_ASSOC);

if ($checkRow && intval($checkRow['cnt']) > 0) {
    echo json_encode(["status" => "error", "message" => "Subject overall progress records already exist. Use update_subject_overall_progress.php instead."]);
    exit;
}

// 3. Get all subjects from BOTH quarter feedback AND schedule (including subject_id_2)
$stmt = $conn->prepare('
    SELECT DISTINCT s.subject_id, s.subject_name 
    FROM tbl_subjects s 
    WHERE s.subject_id IN (
        -- Subjects with quarter feedback
        SELECT DISTINCT qf.subject_id 
        FROM tbl_quarter_feedback qf 
        WHERE qf.student_id = ?
        
        UNION
        
        -- Subjects from schedule (including subject_id_2)
        SELECT DISTINCT si.subject_id 
        FROM tbl_schedule sch 
        JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id 
        WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
        AND si.subject_id IS NOT NULL
        
        UNION
        
        SELECT DISTINCT si.subject_id_2 
        FROM tbl_schedule sch 
        JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id 
        WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
        AND si.subject_id_2 IS NOT NULL
    )
    ORDER BY s.subject_name
');
$stmt->execute([$student_id, $advisory_id, $advisory_id]);
$subjectRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($subjectRows)) {
    echo json_encode(["status" => "error", "message" => "No subjects found with quarter feedback or in schedule for this student."]);
    exit;
}

$subjects = array_column($subjectRows, 'subject_id');

// 4. Get all quarter feedback for this student/subjects/quarters 1-4
$in = implode(',', array_fill(0, count($subjects), '?'));
$params = array_merge([$student_id], $subjects);
$sql = "SELECT subject_id, quarter_id, visual_feedback_id FROM tbl_quarter_feedback WHERE student_id = ? AND subject_id IN ($in) AND quarter_id IN (1,2,3,4)";
$stmt2 = $conn->prepare($sql);
$stmt2->execute($params);
$feedbacks = $stmt2->fetchAll(PDO::FETCH_ASSOC);

// 5. Get dynamic shape-to-score mapping from database
$shapeAvg = getDynamicShapeMapping($conn);
logShapeMapping("insert_subject_overall_progress", $shapeAvg, $conn);

// 6. Get visual_feedback_id to shape
$vfStmt = $conn->prepare('SELECT visual_feedback_id, visual_feedback_shape, min_score, max_score FROM tbl_visual_feedback');
$vfStmt->execute();
$vfRows = $vfStmt->fetchAll(PDO::FETCH_ASSOC);
$shapeToId = [];
foreach ($vfRows as $row) {
    $shapeToId[$row['visual_feedback_shape']] = $row['visual_feedback_id'];
}

// 7. Compute per subject and prepare for insertion
$insertRows = [];
foreach ($subjects as $subject_id) {
    $subjectFeedbacks = array_filter($feedbacks, function($f) use ($subject_id) {
        return $f['subject_id'] == $subject_id;
    });
    
    // Check if we have feedback for all 4 quarters
    if (count($subjectFeedbacks) < 4) {
        // Debug: Log which subjects are missing quarters
        $quarterIds = array_column($subjectFeedbacks, 'quarter_id');
        $missingQuarters = array_diff([1, 2, 3, 4], $quarterIds);
        $subjectName = '';
        foreach ($subjectRows as $sr) {
            if ($sr['subject_id'] == $subject_id) {
                $subjectName = $sr['subject_name'];
                break;
            }
        }
        error_log("Subject '$subjectName' (ID: $subject_id) missing quarters: " . implode(',', $missingQuarters));
        continue; // skip if not all quarters
    }
    
    $scores = [];
    foreach ($subjectFeedbacks as $fb) {
        $vf_id = $fb['visual_feedback_id'];
        $shape = null;
        foreach ($vfRows as $vf) {
            if ($vf['visual_feedback_id'] == $vf_id) {
                $shape = $vf['visual_feedback_shape'];
                break;
            }
        }
        if ($shape && isset($shapeAvg[$shape])) {
            $scores[] = $shapeAvg[$shape];
        }
    }
    
    if (count($scores) < 4) continue;
    
    $avg = round(array_sum($scores) / 4, 3);
    $percent = round(($avg / 4.600) * 100, 3);
    
    // Find visual_feedback_id for this avg (still use avg for shape mapping)
    $final_vf_id = null;
    foreach ($vfRows as $vf) {
        if ($avg >= floatval($vf['min_score']) && $avg <= floatval($vf['max_score'])) {
            $final_vf_id = $vf['visual_feedback_id'];
            break;
        }
    }
    
    if (!$final_vf_id) continue;
    
    // Find subject_name for this subject_id
    $subject_name = null;
    foreach ($subjectRows as $sr) {
        if ($sr['subject_id'] == $subject_id) {
            $subject_name = $sr['subject_name'];
            break;
        }
    }
    
    $insertRows[] = [
        'student_id' => $student_id,
        'subject_id' => $subject_id,
        'advisory_id' => $advisory_id,
        'finalsubj_visual_feedback_id' => $final_vf_id,
        'finalsubj_avg_score' => $percent,
        'subject_name' => $subject_name
    ];
}

if (empty($insertRows)) {
    echo json_encode(["status" => "error", "message" => "No subjects with complete feedback for all quarters."]);
    exit;
}

// 8. Insert new records (this is the INSERT script)
$stmtIns = $conn->prepare('INSERT INTO tbl_subject_overall_progress (student_id, subject_id, advisory_id, finalsubj_visual_feedback_id, finalsubj_avg_score) VALUES (?, ?, ?, ?, ?)');
foreach ($insertRows as $row) {
    $stmtIns->execute([$row['student_id'], $row['subject_id'], $row['advisory_id'], $row['finalsubj_visual_feedback_id'], $row['finalsubj_avg_score']]);
}

echo json_encode(["status" => "success", "inserted" => $insertRows, "message" => "New subject overall progress records inserted successfully."]); 