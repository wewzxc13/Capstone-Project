<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

$data = json_decode(file_get_contents('php://input'), true);
$advisory_id = isset($data['advisory_id']) ? intval($data['advisory_id']) : null;
$teacher_id = isset($data['teacher_id']) ? intval($data['teacher_id']) : null;
$student_id = isset($data['student_id']) ? intval($data['student_id']) : null;
$date = isset($data['date']) ? $data['date'] : null;

if (!$advisory_id && !$teacher_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'advisory_id or teacher_id is required']);
    exit();
}

try {
    // Get advisory_id if only teacher_id is provided
    if (!$advisory_id && $teacher_id) {
        $stmt = $conn->prepare("SELECT advisory_id FROM tbl_advisory WHERE lead_teacher_id = ? OR assistant_teacher_id = ? LIMIT 1");
        $stmt->execute([$teacher_id, $teacher_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $advisory_id = $row['advisory_id'];
        } else {
            echo json_encode(['status' => 'success', 'attendance' => [], 'students' => []]);
            exit();
        }
    }

    // Get all ACTIVE students for this advisory
    $stmt = $conn->prepare("SELECT s.student_id, s.stud_firstname, s.stud_middlename, s.stud_lastname, s.stud_schedule_class FROM tbl_student_assigned sa JOIN tbl_students s ON sa.student_id = s.student_id WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active'");
    $stmt->execute([$advisory_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build attendance query - if student_id is provided, filter by it
    if ($student_id) {
        // Get attendance for specific student only
        $query = "SELECT * FROM tbl_attendance WHERE student_id = ?";
        $params = [$student_id];
        if ($date) {
            $query .= " AND attendance_date = ?";
            $params[] = $date;
        }
        $query .= " ORDER BY attendance_date DESC";
    } else {
        // Get attendance for all students in advisory (original behavior)
        $query = "SELECT * FROM tbl_attendance WHERE student_id IN (SELECT sa.student_id FROM tbl_student_assigned sa JOIN tbl_students s ON sa.student_id = s.student_id WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active')";
        $params = [$advisory_id];
        if ($date) {
            $query .= " AND attendance_date = ?";
            $params[] = $date;
        }
        $query .= " ORDER BY attendance_date DESC";
    }
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'students' => $students,
        'attendance' => $attendance
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 