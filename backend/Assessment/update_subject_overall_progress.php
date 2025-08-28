<?php
require_once __DIR__ . '/../connection.php';
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
// 2. Get all subjects for this advisory (by level)
$stmt = $conn->prepare('SELECT DISTINCT s.subject_id, s.subject_name FROM tbl_schedule sch JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id JOIN tbl_subjects s ON si.subject_id = s.subject_id WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)');
$stmt->execute([$advisory_id]);
$subjectRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($subjectRows)) {
    echo json_encode(["status" => "error", "message" => "No subjects found for this advisory."]);
    exit;
}
$subjects = array_column($subjectRows, 'subject_id');
// 3. Get all quarter feedback for this student/subjects/quarters 1-4
$in = implode(',', array_fill(0, count($subjects), '?'));
$params = array_merge([$student_id], $subjects);
$sql = "SELECT subject_id, quarter_id, visual_feedback_id FROM tbl_quarter_feedback WHERE student_id = ? AND subject_id IN ($in) AND quarter_id IN (1,2,3,4)";
$stmt2 = $conn->prepare($sql);
$stmt2->execute($params);
$feedbacks = $stmt2->fetchAll(PDO::FETCH_ASSOC);
// 4. Get shape mapping
$shapeAvg = [
    '❤️' => 4.600,
    '⭐' => 3.7995,
    '🔷' => 2.9995,
    '▲' => 2.1995,
    '🟡' => 1.3995,
];
// 5. Get visual_feedback_id to shape
$vfStmt = $conn->prepare('SELECT visual_feedback_id, visual_feedback_shape, min_score, max_score FROM tbl_visual_feedback');
$vfStmt->execute();
$vfRows = $vfStmt->fetchAll(PDO::FETCH_ASSOC);
$shapeToId = [];
foreach ($vfRows as $row) {
    $shapeToId[$row['visual_feedback_shape']] = $row['visual_feedback_id'];
}
// 6. Compute per subject and update
$updatedRows = [];
foreach ($subjects as $subject_id) {
    $subjectFeedbacks = array_filter($feedbacks, function($f) use ($subject_id) {
        return $f['subject_id'] == $subject_id;
    });
    if (count($subjectFeedbacks) < 4) continue; // skip if not all quarters
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
    // Only update if record exists
    $checkStmt = $conn->prepare('SELECT subject_overall_id FROM tbl_subject_overall_progress WHERE student_id = ? AND advisory_id = ? AND subject_id = ?');
    $checkStmt->execute([$student_id, $advisory_id, $subject_id]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        $updateStmt = $conn->prepare('UPDATE tbl_subject_overall_progress SET finalsubj_visual_feedback_id = ?, finalsubj_avg_score = ?, computed_at = CURRENT_TIMESTAMP WHERE subject_overall_id = ?');
        $updateStmt->execute([$final_vf_id, $percent, $existing['subject_overall_id']]);
        // Find subject_name for this subject_id
        $subject_name = null;
        foreach ($subjectRows as $sr) {
            if ($sr['subject_id'] == $subject_id) {
                $subject_name = $sr['subject_name'];
                break;
            }
        }
        $updatedRows[] = [
            'subject_overall_id' => $existing['subject_overall_id'],
            'subject_id' => $subject_id,
            'finalsubj_visual_feedback_id' => $final_vf_id,
            'finalsubj_avg_score' => $percent,
            'subject_name' => $subject_name
        ];
    }
}
echo json_encode(["status" => "success", "updated" => $updatedRows]); 