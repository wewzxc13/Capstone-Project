<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

$data = json_decode(file_get_contents("php://input"), true);
$teacher_id = $data['teacher_id'] ?? null;

if (!$teacher_id) {
    echo json_encode(['error' => 'teacher_id is required']);
    exit;
}

try {
    // Debug: Get all advisories
    $stmt = $conn->prepare("SELECT * FROM tbl_advisory");
    $stmt->execute();
    $allAdvisories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: Get teacher details
    $stmt = $conn->prepare("SELECT user_id, user_firstname, user_middlename, user_lastname, user_role FROM tbl_users WHERE user_id = ?");
    $stmt->execute([$teacher_id]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Debug: Find advisory for this teacher
    $stmt = $conn->prepare("SELECT * FROM tbl_advisory WHERE lead_teacher_id = ? OR assistant_teacher_id = ?");
    $stmt->execute([$teacher_id, $teacher_id]);
    $teacherAdvisory = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Debug: Get all students assigned to this teacher's advisory
    $students = [];
    if ($teacherAdvisory) {
        $stmt = $conn->prepare("
            SELECT s.*, sa.assigned_id
            FROM tbl_student_assigned sa
            JOIN tbl_students s ON sa.student_id = s.student_id
            WHERE sa.advisory_id = ?
        ");
        $stmt->execute([$teacherAdvisory['advisory_id']]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Debug: Get all students in the system
    $stmt = $conn->prepare("SELECT * FROM tbl_students");
    $stmt->execute();
    $allStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: Get all student assignments
    $stmt = $conn->prepare("SELECT * FROM tbl_student_assigned");
    $stmt->execute();
    $allAssignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'teacher' => $teacher,
        'teacher_advisory' => $teacherAdvisory,
        'teacher_students' => $students,
        'all_advisories' => $allAdvisories,
        'all_students' => $allStudents,
        'all_assignments' => $allAssignments,
        'debug_info' => [
            'teacher_id_requested' => $teacher_id,
            'teacher_found' => $teacher ? 'Yes' : 'No',
            'advisory_found' => $teacherAdvisory ? 'Yes' : 'No',
            'students_count' => count($students)
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
?> 