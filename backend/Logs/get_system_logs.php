<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

// Check if there was a connection error
if (isset($connection_error)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $connection_error
    ]);
    exit;
}

try {
    // Return all logs so the frontend can paginate and older records are visible
    $stmt = $conn->prepare('SELECT log_id, user_id, target_user_id, target_student_id, action, timestamp FROM tbl_system_logs ORDER BY timestamp DESC');
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = count($logs);
    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'count' => $count
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 