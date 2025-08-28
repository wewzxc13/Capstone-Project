<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

$level_id = isset($_GET['level_id']) ? intval($_GET['level_id']) : null;

if (!$level_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'level_id is required']);
    exit;
}

try {
    // Get all students in this level (both active and inactive)
    $stmt = $conn->prepare("
        SELECT s.*
        FROM tbl_students s
        WHERE s.level_id = ?
        ORDER BY s.stud_lastname, s.stud_firstname
    ");
    $stmt->execute([$level_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'students' => $students,
        'total' => count($students)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
}
?> 