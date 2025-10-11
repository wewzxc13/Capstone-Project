<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

try {
    // Get distinct session classes from students table
    $stmt = $conn->prepare('SELECT DISTINCT stud_schedule_class FROM tbl_students WHERE stud_schedule_class IS NOT NULL AND stud_schedule_class != "" AND stud_school_status = "Active" ORDER BY stud_schedule_class');
    $stmt->execute();
    $sessions = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // If no sessions found, provide default options
    if (empty($sessions)) {
        $sessions = ['Morning', 'Afternoon'];
    }
    
    echo json_encode([
        'status' => 'success',
        'sessions' => $sessions
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