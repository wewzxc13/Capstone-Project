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

if (!$advisory_id || !$subject_id || !$session_class) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
    exit();
}

try {
    // 1. Get all active students in this advisory and session
    $stmt = $conn->prepare('SELECT s.student_id, s.stud_firstname, s.stud_middlename, s.stud_lastname
        FROM tbl_student_assigned sa
        JOIN tbl_students s ON sa.student_id = s.student_id
        WHERE sa.advisory_id = ? AND s.stud_schedule_class = ? AND s.stud_school_status = "Active"
        ORDER BY s.student_id');
    $stmt->execute([$advisory_id, $session_class]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get all activities for this advisory/subject
    $stmt = $conn->prepare('SELECT activity_id, activity_num, activity_name, activity_date, subject_id, quarter_id
        FROM tbl_activities
        WHERE advisory_id = ? AND subject_id = ? AND activity_status = "Active"
        ORDER BY activity_num DESC');
    $stmt->execute([$advisory_id, $subject_id]);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get all tracking (ratings) for these students and activities from appropriate level tables
    $studentIds = array_column($students, 'student_id');
    $activityIds = array_column($activities, 'activity_id');
    $tracking = getTrackingData($conn, $studentIds, $activityIds);

    echo json_encode([
        'status' => 'success',
        'students' => $students,
        'activities' => $activities,
        'tracking' => $tracking
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 