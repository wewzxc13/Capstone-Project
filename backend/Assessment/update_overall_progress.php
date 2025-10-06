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
$user_id = $data['user_id'] ?? null;
if (!$student_id || !$advisory_id || !$user_id) {
    echo json_encode(["status" => "error", "message" => "Missing student_id, advisory_id, or user_id."]);
    exit;
}
// 1. Check if overall progress exists
$stmt = $conn->prepare('SELECT * FROM tbl_overall_progress WHERE student_id = ? AND advisory_id = ?');
$stmt->execute([$student_id, $advisory_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    echo json_encode(["status" => "error", "message" => "No overall progress record found to update."]);
    exit;
}
// 2. Get all 4 quarters' progress cards for this student/advisory
$stmt2 = $conn->prepare('SELECT card_id, quarter_id, risk_id, quarter_avg_score FROM tbl_progress_cards WHERE student_id = ? AND advisory_id = ? AND quarter_id IN (1,2,3,4) ORDER BY quarter_id');
$stmt2->execute([$student_id, $advisory_id]);
$cards = $stmt2->fetchAll(PDO::FETCH_ASSOC);
if (count($cards) < 4) {
    echo json_encode(["status" => "error", "message" => "Not all 4 quarters have progress cards."]);
    exit;
}
// 3. Compute overall average score
$sum = 0;
$risk_counts = [];
foreach ($cards as $c) {
    $sum += floatval($c['quarter_avg_score']);
    $risk = $c['risk_id'];
    if (!isset($risk_counts[$risk])) $risk_counts[$risk] = 0;
    $risk_counts[$risk]++;
}
$overall_avg_score = round($sum / 4, 3);
// 4. Map to scale 1-5
$scale_score = ($overall_avg_score / 100) * 4.6;
$scale_score = round($scale_score, 3);
// 5. Get visual_feedback_id
$vfStmt = $conn->prepare('SELECT visual_feedback_id, visual_feedback_shape, min_score, max_score FROM tbl_visual_feedback');
$vfStmt->execute();
$vfRows = $vfStmt->fetchAll(PDO::FETCH_ASSOC);
$overall_visual_feedback_id = null;
$visual_shape = null;
foreach ($vfRows as $vf) {
    if ($scale_score >= floatval($vf['min_score']) && $scale_score <= floatval($vf['max_score'])) {
        $overall_visual_feedback_id = $vf['visual_feedback_id'];
        $visual_shape = $vf['visual_feedback_shape'];
        break;
    }
}
if (!$overall_visual_feedback_id) {
    echo json_encode(["status" => "error", "message" => "No visual feedback mapping for score: $scale_score"]);
    exit;
}
// 6. Choose risk_id (most frequent, or first if tie)
arsort($risk_counts);
$risk_id = array_key_first($risk_counts);
// 7. Update tbl_overall_progress
$stmtUpd = $conn->prepare('UPDATE tbl_overall_progress SET overall_visual_feedback_id = ?, risk_id = ?, overall_avg_score = ?, computed_at = CURRENT_TIMESTAMP WHERE student_id = ? AND advisory_id = ?');
$stmtUpd->execute([$overall_visual_feedback_id, $risk_id, $overall_avg_score, $student_id, $advisory_id]);
// 8. Return updated record
$stmtGet = $conn->prepare('SELECT * FROM tbl_overall_progress WHERE student_id = ? AND advisory_id = ?');
$stmtGet->execute([$student_id, $advisory_id]);
$row = $stmtGet->fetch(PDO::FETCH_ASSOC);
$vfStmt2 = $conn->prepare('SELECT visual_feedback_shape FROM tbl_visual_feedback WHERE visual_feedback_id = ?');
$vfStmt2->execute([$row['overall_visual_feedback_id']]);
$vf2 = $vfStmt2->fetch(PDO::FETCH_ASSOC);
$visual_shape = $vf2 ? $vf2['visual_feedback_shape'] : null;

// --- Update milestone interpretation if exists ---
try {
    // 1. Get all 4 quarters' progress cards (already in $cards)
    $risk_map = [1 => 'L', 2 => 'M', 3 => 'H'];
    $pattern = '';
    $quarter_performance = [];
    $quarter_summary_map = [1 => 'Excellent / Very Good', 2 => 'Good / Need Help', 3 => 'Not Met'];
    // Sort $cards by quarter_id just in case
    usort($cards, function($a, $b) { return $a['quarter_id'] - $b['quarter_id']; });
    foreach ($cards as $c) {
        $pattern .= $risk_map[$c['risk_id']] ?? 'L';
        $desc = $quarter_summary_map[$c['risk_id']] ?? null;
        $quarter_performance[] = $desc;
    }
    // 2. Look up tbl_risk_summaries for this pattern and quarter performance
    $stmtRisk = $conn->prepare('SELECT * FROM tbl_risk_summaries WHERE risk_pattern = ? AND quarter_1 = ? AND quarter_2 = ? AND quarter_3 = ? AND quarter_4 = ? LIMIT 1');
    $stmtRisk->execute([
        $pattern,
        $quarter_performance[0] ?? '',
        $quarter_performance[1] ?? '',
        $quarter_performance[2] ?? '',
        $quarter_performance[3] ?? ''
    ]);
    $riskRow = $stmtRisk->fetch(PDO::FETCH_ASSOC);
    $auto_summary = $riskRow ? $riskRow['auto_summary'] : null;
    // 3. Get overall_summary from tbl_overall_summaries using $risk_id
    $stmtOverall = $conn->prepare('SELECT summary FROM tbl_overall_summaries WHERE risk_id = ? LIMIT 1');
    $stmtOverall->execute([$risk_id]);
    $overallRow = $stmtOverall->fetch(PDO::FETCH_ASSOC);
    $overall_summary = $overallRow ? $overallRow['summary'] : null;
    // 4. Update tbl_student_milestone_interpretation if exists
    $stmtCheck = $conn->prepare('SELECT milestone_id FROM tbl_student_milestone_interpretation WHERE student_id = ? AND overall_progress_id = ?');
    $stmtCheck->execute([$student_id, $row['overall_progress_id']]);
    $milestone = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    if ($milestone) {
        $stmtUpd = $conn->prepare('UPDATE tbl_student_milestone_interpretation SET summary = ?, overall_summary = ?, recorded_at = NOW() WHERE milestone_id = ?');
        $stmtUpd->execute([$auto_summary, $overall_summary, $milestone['milestone_id']]);
    }
} catch (Exception $e) {
    // Optionally log error
}

// Create notification for overall progress update
try {
    // Get student name
    $studentName = '';
    $stmtStudent = $conn->prepare("SELECT CONCAT(stud_firstname, ' ', stud_middlename, ' ', stud_lastname) AS full_name FROM tbl_students WHERE student_id = ?");
    $stmtStudent->execute([$student_id]);
    $studentRow = $stmtStudent->fetch(PDO::FETCH_ASSOC);
    if ($studentRow) {
        $studentName = trim(preg_replace('/\s+/', ' ', $studentRow['full_name']));
    }
    
    // Get teacher name
    $teacherName = '';
    $stmtTeacher = $conn->prepare("SELECT CONCAT(user_firstname, ' ', user_lastname) AS full_name FROM tbl_users WHERE user_id = ?");
    $stmtTeacher->execute([$user_id]);
    $teacherRow = $stmtTeacher->fetch(PDO::FETCH_ASSOC);
    if ($teacherRow) {
        $teacherName = trim($teacherRow['full_name']);
    }
    
    // Check if notification already exists for this student and teacher combination
    // For overall progress, quarter_id is NULL in tbl_progress_notification
    $checkNotifQuery = "
        SELECT n.notification_id 
        FROM tbl_notification_recipients nr
        INNER JOIN tbl_notifications n ON n.notification_id = nr.notification_id
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        WHERE n.created_by = ? 
        AND nr.recipient_type = 'Teacher' 
        AND nr.user_id = ?
        AND pn.student_id = ?
        AND pn.quarter_id IS NULL
        AND n.notif_message LIKE '%[OVERALL PROGRESS]%'
    ";
    
    $stmtCheck = $conn->prepare($checkNotifQuery);
    $stmtCheck->execute([$user_id, $user_id, $student_id]);
    $existingNotif = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    
    // If existing notification found, update its timestamp; otherwise create new one
    if ($existingNotif) {
        // Update the existing notification's message to standardized "Updated" format and timestamp
        $updateNotif = $conn->prepare("UPDATE tbl_notifications SET notif_message = '[OVERALL PROGRESS] Updated an Overall progress', created_at = NOW() WHERE notification_id = ?");
        $updateNotif->execute([$existingNotif['notification_id']]);
    } else {
        // Create standardized notification message for database storage (third-person format)
        $notificationMessage = "[OVERALL PROGRESS] Updated an Overall progress";
        
        // Insert into tbl_notifications
        $stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
        $stmtNotif->execute([$notificationMessage, $user_id]);
        $notification_id = $conn->lastInsertId();
        
        // Get parent ID for this student
        $stmtParent = $conn->prepare("SELECT parent_id FROM tbl_students WHERE student_id = ?");
        $stmtParent->execute([$student_id]);
        $parentRow = $stmtParent->fetch(PDO::FETCH_ASSOC);
        
        if ($parentRow && $parentRow['parent_id']) {
            // Add parent as recipient
            $stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, 'Parent')");
            $stmtRecipient->execute([$notification_id, $parentRow['parent_id']]);
        }
        
        // Add teacher as recipient
        $stmtRecipient2 = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, 'Teacher')");
        $stmtRecipient2->execute([$notification_id, $user_id]);
        
        // Insert into tbl_progress_notification to link notification with student (overall progress doesn't have quarter_id, so use NULL)
        $stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, NULL, ?)");
        $stmtProgressNotif->execute([$notification_id, $student_id]);
        
        // Debug log for overall progress notification
        error_log("Overall Progress Notification Updated - Notification ID: $notification_id, Student ID: $student_id, Quarter ID: NULL");
    }
    
} catch (Exception $e) {
    // Log error but don't fail the main operation
    error_log("Overall progress notification creation failed: " . $e->getMessage());
}

// --- Subject Overall Progress Calculation ---
try {
    // Check if subject overall progress already exists
    $subjectStmt = $conn->prepare('
        SELECT sop.*, s.subject_name
        FROM tbl_subject_overall_progress sop
        JOIN tbl_subjects s ON sop.subject_id = s.subject_id
        WHERE sop.student_id = ? AND sop.advisory_id = ?
    ');
    $subjectStmt->execute([$student_id, $advisory_id]);
    $existingSubjectProgress = $subjectStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($existingSubjectProgress)) {
        // Calculate and insert subject overall progress
        // 1. Get all subjects from BOTH quarter feedback AND schedule (including subject_id_2)
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
        
        if (!empty($subjectRows)) {
            $subjects = array_column($subjectRows, 'subject_id');
            
            // 2. Get all quarter feedback for this student/subjects/quarters 1-4
            $in = implode(',', array_fill(0, count($subjects), '?'));
            $params = array_merge([$student_id], $subjects);
            $sql = "SELECT subject_id, quarter_id, visual_feedback_id FROM tbl_quarter_feedback WHERE student_id = ? AND subject_id IN ($in) AND quarter_id IN (1,2,3,4)";
            $stmt2 = $conn->prepare($sql);
            $stmt2->execute($params);
            $feedbacks = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            
            // 3. Get visual_feedback mapping
            $vfStmt = $conn->prepare('SELECT visual_feedback_id, visual_feedback_shape, min_score, max_score FROM tbl_visual_feedback');
            $vfStmt->execute();
            $vfRows = $vfStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 4. Get dynamic shape-to-score mapping from database
            $shapeAvg = getDynamicShapeMapping($conn);
            logShapeMapping("update_overall_progress", $shapeAvg, $conn);
            
            // 5. Calculate per subject
            $stmtIns = $conn->prepare('INSERT INTO tbl_subject_overall_progress (student_id, subject_id, advisory_id, finalsubj_visual_feedback_id, finalsubj_avg_score) VALUES (?, ?, ?, ?, ?)');
            
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
                
                // Find visual_feedback_id for this avg
                $final_vf_id = null;
                foreach ($vfRows as $vf) {
                    if ($avg >= floatval($vf['min_score']) && $avg <= floatval($vf['max_score'])) {
                        $final_vf_id = $vf['visual_feedback_id'];
                        break;
                    }
                }
                
                if (!$final_vf_id) continue;
                
                // Insert subject overall progress
                $stmtIns->execute([$student_id, $subject_id, $advisory_id, $final_vf_id, $percent]);
            }
        }
    }
    
    $response['subject_progress'] = 'calculated';
} catch (Exception $e) {
    $response['subject_progress'] = 'error: ' . $e->getMessage();
}

$response = [
    "status" => "success",
    "progress" => [
        "overall_progress_id" => $row['overall_progress_id'],
        "student_id" => $row['student_id'],
        "advisory_id" => $row['advisory_id'],
        "overall_avg_score" => $row['overall_avg_score'],
        "visual_feedback_id" => $row['overall_visual_feedback_id'],
        "visual_shape" => $visual_shape,
        "risk_id" => $row['risk_id']
    ]
];
echo json_encode($response); 