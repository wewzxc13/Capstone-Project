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

try {
    // Get all teachers (role_id = 3)
    $stmt = $conn->prepare("
        SELECT user_id, user_firstname, user_middlename, user_lastname 
        FROM tbl_users 
        WHERE user_role = 3 AND user_status = 'Active'
        ORDER BY user_id
    ");
    $stmt->execute();
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all advisories
    $stmt = $conn->prepare("SELECT * FROM tbl_advisory ORDER BY advisory_id");
    $stmt->execute();
    $advisories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all students with their assignments
    $stmt = $conn->prepare("
        SELECT s.*, sa.advisory_id, sa.assigned_id
        FROM tbl_students s
        LEFT JOIN tbl_student_assigned sa ON s.student_id = sa.student_id
        ORDER BY s.student_id
    ");
    $stmt->execute();
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check which teachers are assigned to advisories
    $assignedTeachers = [];
    foreach ($advisories as $advisory) {
        if ($advisory['lead_teacher_id']) {
            $assignedTeachers[] = $advisory['lead_teacher_id'];
        }
        if ($advisory['assistant_teacher_id']) {
            $assignedTeachers[] = $advisory['assistant_teacher_id'];
        }
    }
    
    // Find unassigned teachers
    $unassignedTeachers = array_filter($teachers, function($teacher) use ($assignedTeachers) {
        return !in_array($teacher['user_id'], $assignedTeachers);
    });
    
    // Check for orphaned students (students without advisory assignment)
    $orphanedStudents = array_filter($students, function($student) {
        return !$student['advisory_id'];
    });
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'teachers' => $teachers,
            'advisories' => $advisories,
            'students' => $students,
            'assigned_teachers' => array_unique($assignedTeachers),
            'unassigned_teachers' => array_values($unassignedTeachers),
            'orphaned_students' => array_values($orphanedStudents),
            'summary' => [
                'total_teachers' => count($teachers),
                'total_advisories' => count($advisories),
                'total_students' => count($students),
                'assigned_teachers_count' => count(array_unique($assignedTeachers)),
                'unassigned_teachers_count' => count($unassignedTeachers),
                'orphaned_students_count' => count($orphanedStudents)
            ]
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 