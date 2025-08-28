<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

// Test with student_id = 3
$student_id = 3;

try {
    // First, get the student's advisory_id
    $stmt = $conn->prepare("SELECT sa.advisory_id FROM tbl_student_assigned sa WHERE sa.student_id = ?");
    $stmt->execute([$student_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Student not found or not assigned to any advisory'
        ]);
        exit();
    }
    
    $advisory_id = $result['advisory_id'];
    
    // Test the current get_attendance.php logic
    $query = "SELECT * FROM tbl_attendance WHERE student_id = ? ORDER BY attendance_date ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute([$student_id]);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Also test the original query (for comparison)
    $originalQuery = "SELECT * FROM tbl_attendance WHERE student_id IN (SELECT sa.student_id FROM tbl_student_assigned sa JOIN tbl_students s ON sa.student_id = s.student_id WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active') ORDER BY attendance_date DESC";
    $stmt = $conn->prepare($originalQuery);
    $stmt->execute([$advisory_id]);
    $originalAttendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'test_info' => [
            'student_id' => $student_id,
            'advisory_id' => $advisory_id
        ],
        'new_query_results' => [
            'query' => $query,
            'count' => count($attendance),
            'data' => $attendance
        ],
        'original_query_results' => [
            'query' => $originalQuery,
            'count' => count($originalAttendance),
            'data' => $originalAttendance
        ],
        'comparison' => [
            'new_query_count' => count($attendance),
            'original_query_count' => count($originalAttendance),
            'difference' => count($originalAttendance) - count($attendance)
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 