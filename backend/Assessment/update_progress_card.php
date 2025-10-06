<?php
require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/shape_mapping_helper.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Only POST requests are allowed."]);
    exit;
}
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(["status" => "error", "message" => "Missing or invalid JSON body."]);
    exit;
}
$student_id = $data['student_id'] ?? null;
$advisory_id = $data['advisory_id'] ?? null;
$quarter_id = $data['quarter_id'] ?? null;
$user_id = $data['user_id'] ?? null;

$missing = [];
if (!$student_id) $missing[] = 'student_id';
if (!$advisory_id) $missing[] = 'advisory_id';
if (!$quarter_id) $missing[] = 'quarter_id';
if (!$user_id) $missing[] = 'user_id';
if (!empty($missing)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters: " . implode(', ', $missing)]);
    exit;
}
// Check if progress card exists
$stmtCheck = $conn->prepare('SELECT * FROM tbl_progress_cards WHERE student_id = ? AND advisory_id = ? AND quarter_id = ?');
$stmtCheck->execute([$student_id, $advisory_id, $quarter_id]);
if (!$stmtCheck->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode(["status" => "error", "message" => "Progress card does not exist for this student/quarter."]);
    exit;
}
// Get all subjects for this advisory (by level)
$stmt = $conn->prepare('
    SELECT DISTINCT s.subject_id, s.subject_name
    FROM tbl_schedule sch
    JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id
    JOIN tbl_subjects s ON si.subject_id = s.subject_id
    WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
');
$stmt->execute([$advisory_id]);
$subjectRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$subjects = array_column($subjectRows, 'subject_id');
if (empty($subjects)) {
    echo json_encode(["status" => "error", "message" => "No subjects found for this advisory."]);
    exit;
}
// Get all quarter feedback for this student/quarter/subjects
$in = implode(',', array_fill(0, count($subjects), '?'));
$params = array_merge([$student_id, $quarter_id], $subjects);
$sql = "SELECT subject_id, visual_feedback_id FROM tbl_quarter_feedback WHERE student_id = ? AND quarter_id = ? AND subject_id IN ($in)";
$stmt2 = $conn->prepare($sql);
$stmt2->execute($params);
$feedbacks = $stmt2->fetchAll(PDO::FETCH_ASSOC);

// Check if all subjects have feedback, but don't block the update
$missingSubjects = [];
$missingSubjectNames = [];
if (count($feedbacks) < count($subjects)) {
    $feedbackSubjectIds = array_column($feedbacks, 'subject_id');
    $missingSubjects = array_diff($subjects, $feedbackSubjectIds);
    foreach ($subjectRows as $row) {
        if (in_array($row['subject_id'], $missingSubjects)) {
            $missingSubjectNames[] = $row['subject_name'];
        }
    }
}

// If no feedback at all, return error
if (empty($feedbacks)) {
    echo json_encode([
        "status" => "error",
        "message" => "No feedback found for this quarter. Please add feedback for at least one subject."
    ]);
    exit;
}

// Get dynamic shape-to-score mapping from database
$shapeAvg = getDynamicShapeMapping($conn);
logShapeMapping("update_progress_card", $shapeAvg, $conn);
$shapeScores = [];
foreach ($feedbacks as $fb) {
    $vf_id = $fb['visual_feedback_id'];
    $shapeRow = $conn->query("SELECT visual_feedback_shape FROM tbl_visual_feedback WHERE visual_feedback_id = " . intval($vf_id))->fetch(PDO::FETCH_ASSOC);
    if ($shapeRow && isset($shapeAvg[$shapeRow['visual_feedback_shape']])) {
        $shapeScores[] = $shapeAvg[$shapeRow['visual_feedback_shape']];
    }
}

if (empty($shapeScores)) {
    echo json_encode(["status" => "error", "message" => "No valid shape scores found for this student/quarter."]);
    exit;
}

$totalScore = array_sum($shapeScores);
$count = count($shapeScores);
$averageScore = $totalScore / $count;
$averageScore = round($averageScore, 3);
$quarter_avg_score = round(($averageScore / 4.600) * 100, 3);

// Determine quarter_visual_feedback_id
$sql3 = "SELECT visual_feedback_id, visual_feedback_shape FROM tbl_visual_feedback WHERE ? >= min_score AND ? <= max_score ORDER BY min_score DESC LIMIT 1";
$stmt3 = $conn->prepare($sql3);
$stmt3->execute([$averageScore, $averageScore]);
$row = $stmt3->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    echo json_encode(["status" => "error", "message" => "No visual_feedback_id found for averageScore $averageScore"]);
    exit;
}
$quarter_visual_feedback_id = $row['visual_feedback_id'];
$shape = $row['visual_feedback_shape'];

// Determine risk_id dynamically based on shape
$risk_id = getRiskLevelForShape($shape, $conn);

// Update the progress card
$sql4 = "UPDATE tbl_progress_cards SET quarter_visual_feedback_id=?, risk_id=?, quarter_avg_score=?, is_finalized=1, finalized_by=?, report_date=NOW() WHERE student_id=? AND advisory_id=? AND quarter_id=?";
$stmt4 = $conn->prepare($sql4);
$ok = $stmt4->execute([$quarter_visual_feedback_id, $risk_id, $quarter_avg_score, $user_id, $student_id, $advisory_id, $quarter_id]);

if ($ok && $stmt4->rowCount() > 0) {
    // Create notification for progress card update (only if unique combination)
    file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "=== UPDATE NOTIFICATION CREATION START ===\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Student ID: $student_id, Quarter ID: $quarter_id, Teacher ID: $user_id\n", FILE_APPEND);
    
    try {
        // Get student name
        $studentName = '';
        $stmtStudent = $conn->prepare("SELECT CONCAT(stud_firstname, ' ', stud_middlename, ' ', stud_lastname) AS full_name FROM tbl_students WHERE student_id = ?");
        $stmtStudent->execute([$student_id]);
        $studentRow = $stmtStudent->fetch(PDO::FETCH_ASSOC);
        if ($studentRow) {
            $studentName = trim(preg_replace('/\s+/', ' ', $studentRow['full_name']));
        }
        
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Student name: $studentName\n", FILE_APPEND);
        
        // Check if notification already exists for this student, quarter, and teacher combination
        $checkNotifQuery = "
            SELECT n.notification_id 
            FROM tbl_notifications n
            INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
            INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
            WHERE n.created_by = ? 
            AND nr.recipient_type = 'Teacher' 
            AND nr.user_id = ?
            AND pn.student_id = ?
            AND pn.quarter_id = ?
            AND n.notif_message LIKE '%[QUARTERLY PROGRESS]%'
        ";
        
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Check Query: $checkNotifQuery\n", FILE_APPEND);
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Check Params: " . json_encode([$user_id, $user_id, $student_id, $quarter_id]) . "\n", FILE_APPEND);
        
        $stmtCheck = $conn->prepare($checkNotifQuery);
        $stmtCheck->execute([$user_id, $user_id, $student_id, $quarter_id]);
        $existingNotif = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Existing notification found: " . ($existingNotif ? "YES" : "NO") . "\n", FILE_APPEND);
        
        // If existing notification found, update its timestamp; otherwise create new one
        if ($existingNotif) {
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Updating existing notification ID: " . $existingNotif['notification_id'] . "\n", FILE_APPEND);
            // Update the existing notification's message to standardized "Updated" format and timestamp
            $updateNotif = $conn->prepare("UPDATE tbl_notifications SET notif_message = '[QUARTERLY PROGRESS] Updated a Quarterly Progress', created_at = NOW() WHERE notification_id = ?");
            $updateNotif->execute([$existingNotif['notification_id']]);
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Updated existing notification message to: [QUARTERLY PROGRESS] Updated a Quarterly Progress\n", FILE_APPEND);
        } else {
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Creating new notification\n", FILE_APPEND);
            
            // Create standardized notification message for database storage (third-person format)
            $notificationMessage = "[QUARTERLY PROGRESS] Updated a Quarterly Progress";
            
            // Insert into tbl_notifications
            $stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
            $stmtNotif->execute([$notificationMessage, $user_id]);
            $notification_id = $conn->lastInsertId();
            
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Inserted into tbl_notifications, ID: $notification_id\n", FILE_APPEND);
            
            // Get parent ID for this student
            $stmtParent = $conn->prepare("SELECT parent_id FROM tbl_students WHERE student_id = ?");
            $stmtParent->execute([$student_id]);
            $parentRow = $stmtParent->fetch(PDO::FETCH_ASSOC);
            
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Parent row: " . json_encode($parentRow) . "\n", FILE_APPEND);
            
            if ($parentRow && $parentRow['parent_id']) {
                // Add parent as recipient
                $stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, 'Parent')");
                $stmtRecipient->execute([$notification_id, $parentRow['parent_id']]);
                file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Inserted parent recipient\n", FILE_APPEND);
            }
            
            // Add teacher as recipient
            $stmtRecipient2 = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, 'Teacher')");
            $stmtRecipient2->execute([$notification_id, $user_id]);
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Inserted teacher recipient\n", FILE_APPEND);
            
            // Insert into tbl_progress_notification to link notification with student and quarter
            $stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, ?, ?)");
            $stmtProgressNotif->execute([$notification_id, $quarter_id, $student_id]);
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Inserted into tbl_progress_notification\n", FILE_APPEND);
            
            file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "=== UPDATE NOTIFICATION CREATION SUCCESS ===\n", FILE_APPEND);
        }
        
    } catch (Exception $e) {
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "=== UPDATE NOTIFICATION EXCEPTION ===\n", FILE_APPEND);
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Error: " . $e->getMessage() . "\n", FILE_APPEND);
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "File: " . $e->getFile() . "\n", FILE_APPEND);
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "Line: " . $e->getLine() . "\n", FILE_APPEND);
        file_put_contents(__DIR__ . '/debug_update_progress_card.txt', "=== END EXCEPTION ===\n", FILE_APPEND);
        // Log error but don't fail the main operation
        error_log("Notification creation failed: " . $e->getMessage());
    }
    
    $message = "Progress card updated successfully.";
    if (!empty($missingSubjectNames)) {
        $message .= " Note: Missing feedback for: " . implode(', ', $missingSubjectNames);
    }
    echo json_encode([
        "status" => "success", 
        "message" => $message,
        "missing_subjects" => $missingSubjectNames
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update progress card or no changes made."]);
} 