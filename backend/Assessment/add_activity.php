<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';
include_once 'tracking_helper.php';

$input = json_decode(file_get_contents('php://input'), true);
$advisory_id = isset($input['advisory_id']) ? intval($input['advisory_id']) : null;
$subject_id = isset($input['subject_id']) ? intval($input['subject_id']) : null;
$session_class = isset($input['session_class']) ? $input['session_class'] : null;
$activity_name = isset($input['activity_name']) ? trim($input['activity_name']) : null;
$activity_date = isset($input['activity_date']) ? $input['activity_date'] : null;
// quarter_id is no longer taken from input

if (!$advisory_id || !$subject_id || !$session_class || !$activity_name || !$activity_date) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
    exit();
}

try {
    // Always determine quarter_id from activity_date
    $quarter_sql = 'SELECT quarter_id FROM tbl_quarters WHERE start_date <= ? AND end_date >= ? LIMIT 1';
    $stmt = $conn->prepare($quarter_sql);
    $stmt->execute([$activity_date, $activity_date]);
    $quarter = $stmt->fetch(PDO::FETCH_ASSOC);
    $quarter_id = $quarter ? $quarter['quarter_id'] : null;
    if (!$quarter_id) {
        echo json_encode(['status' => 'error', 'message' => 'No matching quarter for this date.']);
        exit();
    }

    // Check for duplicate date in the same advisory, subject, and session
    // Since tbl_activities doesn't store session_class, we need to check if there are students
    // in this advisory with the same session_class and if an activity already exists for this date/subject
    $duplicate_check = $conn->prepare('
        SELECT COUNT(*) FROM tbl_activities a
        JOIN tbl_student_assigned sa ON a.advisory_id = sa.advisory_id
        JOIN tbl_students s ON sa.student_id = s.student_id
        WHERE a.advisory_id = ? AND a.subject_id = ? AND a.activity_date = ? AND s.stud_schedule_class = ? AND a.activity_status = "Active"
    ');
    $duplicate_check->execute([$advisory_id, $subject_id, $activity_date, $session_class]);
    $duplicate_count = $duplicate_check->fetchColumn();
    
    if ($duplicate_count > 0) {
        echo json_encode(['status' => 'error', 'message' => 'An activity with the same date already exists for this subject and session.']);
        exit();
    }

    // 1. Get all students assigned to this advisory and session
    $stmt = $conn->prepare('SELECT s.student_id FROM tbl_student_assigned sa JOIN tbl_students s ON sa.student_id = s.student_id WHERE sa.advisory_id = ? AND s.stud_schedule_class = ?');
    $stmt->execute([$advisory_id, $session_class]);
    $students = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($students)) {
        echo json_encode(['status' => 'error', 'message' => 'No students found for this advisory and session.']);
        exit();
    }

    // 2. Get next activity_num for this advisory/subject/quarter
    $stmt = $conn->prepare('SELECT COALESCE(MAX(activity_num), 0) + 1 AS next_activity FROM tbl_activities WHERE advisory_id = ? AND subject_id = ? AND quarter_id = ? AND activity_status = "Active"');
    $stmt->execute([$advisory_id, $subject_id, $quarter_id]);
    $next_activity = $stmt->fetchColumn();
    if (!$next_activity) $next_activity = 1;

    // 3. Insert new activity into tbl_activities (now with quarter_id)
    $insertActivity = $conn->prepare('INSERT INTO tbl_activities (advisory_id, subject_id, quarter_id, activity_name, activity_date, activity_num, activity_status) VALUES (?, ?, ?, ?, ?, ?, "Active")');
    $insertActivity->execute([$advisory_id, $subject_id, $quarter_id, $activity_name, $activity_date, $next_activity]);
    $activity_id = $conn->lastInsertId();

    // 4. Insert into appropriate tracking table for each student based on their level
    foreach ($students as $student_id) {
        insertTrackingRecord($conn, $student_id, $activity_id);
    }

    // Resequence activity_num for all activities in this advisory, subject, and quarter
    $stmt = $conn->prepare('SELECT activity_id FROM tbl_activities WHERE advisory_id = ? AND subject_id = ? AND quarter_id = ? AND activity_status = "Active" ORDER BY activity_date ASC, activity_id ASC');
    $stmt->execute([$advisory_id, $subject_id, $quarter_id]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $num = 1;
    foreach ($ids as $id) {
        $update = $conn->prepare('UPDATE tbl_activities SET activity_num = ? WHERE activity_id = ?');
        $update->execute([$num++, $id]);
    }

    echo json_encode(['status' => 'success', 'message' => 'Activity added successfully.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 