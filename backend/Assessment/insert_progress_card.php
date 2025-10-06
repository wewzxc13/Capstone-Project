<?php
require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/shape_mapping_helper.php';
header('Content-Type: application/json');

file_put_contents(__DIR__ . '/debug_progress_card.txt', "UNIQUE DEBUG LINE AT TOP\n", FILE_APPEND);

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "ERROR: Missing or invalid JSON body\n", FILE_APPEND);
        echo json_encode(["status" => "error", "message" => "Missing or invalid JSON body. Please send a JSON object with student_id, advisory_id, and quarter_id (or omit student_id for batch mode)."]);
        exit;
    }
    $student_id = $data['student_id'] ?? null;
    $advisory_id = $data['advisory_id'] ?? null;
    $quarter_id = $data['quarter_id'] ?? null;
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "POST DATA: " . json_encode($data) . "\n", FILE_APPEND);
} elseif ($method === 'GET') {
    $student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
    $advisory_id = isset($_GET['advisory_id']) ? $_GET['advisory_id'] : null;
    $quarter_id = isset($_GET['quarter_id']) ? $_GET['quarter_id'] : null;
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "GET PARAMS: " . json_encode($_GET) . "\n", FILE_APPEND);
} else {
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "ERROR: Invalid request method: $method\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "This endpoint only accepts POST requests with a JSON body or GET requests with query parameters for testing."]);
    exit;
}

$missing = [];
if (!$advisory_id) $missing[] = 'advisory_id';
if (!$quarter_id) $missing[] = 'quarter_id';
if (!empty($missing)) {
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "ERROR: Missing required parameters: " . implode(', ', $missing) . "\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Missing required parameters: " . implode(', ', $missing)]);
    exit;
}

$student_ids = [];
if ($student_id) {
    $student_ids = [$student_id];
} else {
    // Batch mode: get all students in this advisory
    $stmtStud = $conn->prepare('SELECT student_id FROM tbl_student_assigned WHERE advisory_id = ?');
    $stmtStud->execute([$advisory_id]);
    $student_ids = array_column($stmtStud->fetchAll(PDO::FETCH_ASSOC), 'student_id');
}

$insertedNames = [];
foreach ($student_ids as $sid) {
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "DEBUG: Entered foreach for student $sid\n", FILE_APPEND);
    // 1. Get all subjects for this advisory (by level, matching dashboard logic)
    $subjects = [];
    $stmt = $conn->prepare('
        SELECT DISTINCT s.subject_id, s.subject_name
        FROM tbl_schedule sch
        JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id
        JOIN tbl_subjects s ON si.subject_id = s.subject_id
        WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
    ');
    $stmt->execute([$advisory_id]);
    $subjectRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($subjectRows as $row) {
        $subjects[] = $row['subject_id'];
    }
    if (empty($subjects)) {
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "SKIP: No subjects for advisory $advisory_id\n", FILE_APPEND);
        continue;
    }
    // 2. Get all quarter feedback for this student/quarter/subjects
    $in = implode(',', array_fill(0, count($subjects), '?'));
    $params = array_merge([$sid, $quarter_id], $subjects);
    $sql = "SELECT subject_id, visual_feedback_id FROM tbl_quarter_feedback WHERE student_id = ? AND quarter_id = ? AND subject_id IN ($in)";
    $stmt2 = $conn->prepare($sql);
    $stmt2->execute($params);
    $feedbacks = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "DEBUG: Feedbacks found: " . count($feedbacks) . ", Subjects needed: " . count($subjects) . "\n", FILE_APPEND);
    if (count($feedbacks) < count($subjects)) {
        $feedbackSubjectIds = array_column($feedbacks, 'subject_id');
        $missingSubjects = array_diff($subjects, $feedbackSubjectIds);
        // Get missing subject names
        $missingNames = [];
        foreach ($subjectRows as $row) {
            if (in_array($row['subject_id'], $missingSubjects)) {
                $missingNames[] = $row['subject_name'];
            }
        }
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "SKIP: Not enough feedbacks for student $sid, quarter $quarter_id. Missing: " . implode(',', $missingNames) . "\n", FILE_APPEND);
        echo json_encode([
            "status" => "error",
            "message" => "Not all subjects have feedback. Missing feedback for: " . implode(', ', $missingNames),
            "missing_subjects" => $missingNames
        ]);
        exit;
    }
    // 3. Get dynamic shape-to-score mapping from database
    $shapeAvg = getDynamicShapeMapping($conn);
    logShapeMapping("insert_progress_card", $shapeAvg, $conn);
    // 4. Get shape for each feedback
    $shapeScores = [];
    foreach ($feedbacks as $fb) {
        $vf_id = $fb['visual_feedback_id'];
        $shapeRow = $conn->query("SELECT visual_feedback_shape FROM tbl_visual_feedback WHERE visual_feedback_id = " . intval($vf_id))->fetch(PDO::FETCH_ASSOC);
        if ($shapeRow && isset($shapeAvg[$shapeRow['visual_feedback_shape']])) {
            $shapeScores[] = $shapeAvg[$shapeRow['visual_feedback_shape']];
        } else {
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "SKIP: No shape row for feedback visual_feedback_id $vf_id\n", FILE_APPEND);
            continue;
        }
    }
    if (count($shapeScores) < count($subjects)) {
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "SKIP: Not all shape scores found for student $sid, quarter $quarter_id\n", FILE_APPEND);
        continue;
    }
    // 5. Calculate average and percentage
    $totalScore = array_sum($shapeScores);
    $count = count($shapeScores);
    $averageScore = $totalScore / $count;
    $averageScore = round($averageScore, 3); // Ensure 3 decimal places for category lookup
    $quarter_avg_score = round(($averageScore / 4.600) * 100, 3); // 4.600 is Heart (max)
    // 6. Determine quarter_visual_feedback_id (use averageScore, not percentage)
    $sql3 = "SELECT visual_feedback_id, visual_feedback_shape FROM tbl_visual_feedback WHERE ? >= min_score AND ? <= max_score ORDER BY min_score DESC LIMIT 1";
    $stmt3 = $conn->prepare($sql3);
    $stmt3->execute([$averageScore, $averageScore]);
    $row = $stmt3->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "ERROR: No visual_feedback_id found for averageScore $averageScore\n", FILE_APPEND);
        continue;
    }
    $quarter_visual_feedback_id = $row['visual_feedback_id'];
    $shape = $row['visual_feedback_shape'];
    // 7. Determine risk_id dynamically based on shape
    $risk_id = getRiskLevelForShape($shape, $conn);
    // Use user_id from POST data for finalized_by
    $finalized_by = $data['user_id'] ?? null;
    if (!$finalized_by) {
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "ERROR: finalized_by (user_id) is null\n", FILE_APPEND);
        echo json_encode([
            "status" => "error",
            "message" => "User not logged in or user_id missing. Cannot finalize progress card.",
            "students" => []
        ]);
        exit;
    }
    // Debug logging
    file_put_contents(__DIR__ . '/debug_progress_card.txt', json_encode([
        'advisory_id' => $advisory_id,
        'student_id' => $sid,
        'quarter_id' => $quarter_id,
        'subjects' => $subjects,
        'feedbacks' => $feedbacks,
        'shapeScores' => $shapeScores,
        'averageScore' => $averageScore,
        'quarter_avg_score' => $quarter_avg_score,
        'quarter_visual_feedback_id' => $quarter_visual_feedback_id,
        'risk_id' => $risk_id,
        'finalized_by' => $finalized_by
    ]) . "\n", FILE_APPEND);
    // 8. Insert into tbl_progress_cards with is_finalized=1 and finalized_by
    $sql4 = "INSERT INTO tbl_progress_cards (student_id, advisory_id, quarter_id, quarter_visual_feedback_id, 
    risk_id, quarter_avg_score, is_finalized, finalized_by, report_date) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 
    NOW()) ON DUPLICATE KEY UPDATE quarter_visual_feedback_id=VALUES(quarter_visual_feedback_id), 
    risk_id=VALUES(risk_id), quarter_avg_score=VALUES(quarter_avg_score), is_finalized=1, 
    finalized_by=VALUES(finalized_by), report_date=VALUES(report_date)";
    $stmt4 = $conn->prepare($sql4);
    // Debug: Start insert attempt
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "=== INSERT ATTEMPT START ===\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "student_id: " . var_export($sid, true) . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "advisory_id: " . var_export($advisory_id, true) . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "quarter_id: " . var_export($quarter_id, true) . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "quarter_visual_feedback_id: " . var_export($quarter_visual_feedback_id, true) . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "risk_id: " . var_export($risk_id, true) . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "quarter_avg_score: " . var_export($quarter_avg_score, true) . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "finalized_by: " . var_export($finalized_by, true) . "\n", FILE_APPEND);
    try {
        $ok = $stmt4->execute([$sid, $advisory_id, $quarter_id, $quarter_visual_feedback_id, $risk_id, $quarter_avg_score, $finalized_by]);
        $affected = $stmt4->rowCount();
        // Debug: Log insert SQL, params, and result
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "Insert SQL: $sql4\nParams: " . json_encode([$sid, $advisory_id, $quarter_id, $quarter_visual_feedback_id, $risk_id, $quarter_avg_score, $finalized_by]) . "\nOK: $ok, Affected: $affected\n", FILE_APPEND);
    } catch (Exception $e) {
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "Insert Exception: " . $e->getMessage() . "\n", FILE_APPEND);
    }
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "=== INSERT ATTEMPT END ===\n\n", FILE_APPEND);
    if ($ok && $affected > 0) {
        // Fetch student name for success message
        $studentName = null;
        $stmtName = $conn->prepare("SELECT CONCAT(stud_firstname, ' ', stud_middlename, ' ', stud_lastname) AS full_name FROM tbl_students WHERE student_id = ?");
        $stmtName->execute([$sid]);
        $rowName = $stmtName->fetch(PDO::FETCH_ASSOC);
        if ($rowName && trim($rowName['full_name'])) {
            $studentName = trim(preg_replace('/\s+/', ' ', $rowName['full_name']));
            $insertedNames[] = $studentName;
        }
        
        // 9. Create notification for progress card creation (only if unique combination)
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "=== NOTIFICATION CREATION START ===\n", FILE_APPEND);
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "Student ID: $sid, Quarter ID: $quarter_id, Teacher ID: $finalized_by\n", FILE_APPEND);
        
        try {
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
            
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "Check Query: $checkNotifQuery\n", FILE_APPEND);
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "Check Params: " . json_encode([$finalized_by, $finalized_by, $sid, $quarter_id]) . "\n", FILE_APPEND);
            
            $stmtCheck = $conn->prepare($checkNotifQuery);
            $stmtCheck->execute([$finalized_by, $finalized_by, $sid, $quarter_id]);
            $existingNotif = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "Existing notification found: " . ($existingNotif ? "YES" : "NO") . "\n", FILE_APPEND);
            
            // If existing notification found, update its message to "Updated" and timestamp; otherwise create new one
            if ($existingNotif) {
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "Updating existing notification ID: " . $existingNotif['notification_id'] . "\n", FILE_APPEND);
                
                // Update the existing notification's message to standardized "Updated" format and timestamp
                $updateNotif = $conn->prepare("UPDATE tbl_notifications SET notif_message = '[QUARTERLY PROGRESS] Updated a Quarterly Progress', created_at = NOW() WHERE notification_id = ?");
                $updateNotif->execute([$existingNotif['notification_id']]);
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "Updated existing notification message to: [QUARTERLY PROGRESS] Updated a Quarterly Progress\n", FILE_APPEND);
            } else {
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "Creating new notification\n", FILE_APPEND);
                
                // Create standardized notification message for database storage (third-person format)
                $notificationMessage = "[QUARTERLY PROGRESS] Finalized a Quarterly Progress";
                
                // Insert into tbl_notifications
                $stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
                $stmtNotif->execute([$notificationMessage, $finalized_by]);
                $notification_id = $conn->lastInsertId();
                
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "Inserted into tbl_notifications, ID: $notification_id\n", FILE_APPEND);
                
                // Get parent ID for this student
                $stmtParent = $conn->prepare("SELECT parent_id FROM tbl_students WHERE student_id = ?");
                $stmtParent->execute([$sid]);
                $parentRow = $stmtParent->fetch(PDO::FETCH_ASSOC);
                
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "Parent row: " . json_encode($parentRow) . "\n", FILE_APPEND);
                
                if ($parentRow && $parentRow['parent_id']) {
                    // Add parent as recipient
                    $stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, 'Parent')");
                    $stmtRecipient->execute([$notification_id, $parentRow['parent_id']]);
                    file_put_contents(__DIR__ . '/debug_progress_card.txt', "Inserted parent recipient\n", FILE_APPEND);
                }
                
                // Add teacher as recipient
                $stmtRecipient2 = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, 'Teacher')");
                $stmtRecipient2->execute([$notification_id, $finalized_by]);
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "Inserted teacher recipient\n", FILE_APPEND);
                
                // Insert into tbl_progress_notification to link notification with student and quarter
                $stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, ?, ?)");
                $stmtProgressNotif->execute([$notification_id, $quarter_id, $sid]);
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "Inserted into tbl_progress_notification\n", FILE_APPEND);
                
                file_put_contents(__DIR__ . '/debug_progress_card.txt', "=== NOTIFICATION CREATION SUCCESS ===\n", FILE_APPEND);
            }
            
        } catch (Exception $e) {
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "=== NOTIFICATION EXCEPTION ===\n", FILE_APPEND);
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "Error: " . $e->getMessage() . "\n", FILE_APPEND);
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "File: " . $e->getFile() . "\n", FILE_APPEND);
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "Line: " . $e->getLine() . "\n", FILE_APPEND);
            file_put_contents(__DIR__ . '/debug_progress_card.txt', "=== END EXCEPTION ===\n", FILE_APPEND);
        }
        
    } else if ($ok && $affected == 0) {
        file_put_contents(__DIR__ . '/debug_progress_card.txt', "NOCHANGE: Progress card already up to date for student $sid, quarter $quarter_id\n", FILE_APPEND);
        echo json_encode([
            "status" => "nochange",
            "message" => "No changes made. Progress card already up to date.",
            "students" => []
        ]);
        exit;
    }
}
if (!empty($insertedNames)) {
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "SUCCESS: Progress card(s) inserted/updated for: " . implode(', ', $insertedNames) . "\n", FILE_APPEND);
    echo json_encode([
        "status" => "success",
        "message" => "Progress card(s) inserted/updated for: ",
        "students" => $insertedNames
    ]);
} else {
    file_put_contents(__DIR__ . '/debug_progress_card.txt', "SUCCESS: No new progress cards inserted/updated.\n", FILE_APPEND);
    echo json_encode([
        "status" => "success",
        "message" => "No new progress cards inserted/updated.",
        "students" => []
    ]);
} 
