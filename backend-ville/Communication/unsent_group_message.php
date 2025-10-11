<?php
// Start output buffering FIRST to catch any errors
ob_start();

// Suppress all error display (errors will be logged instead)
@ini_set('display_errors', '0');
@ini_set('display_startup_errors', '0');
@ini_set('html_errors', '0');
@error_reporting(0);

header("Content-Type: application/json; charset=utf-8");

// Include dynamic CORS configuration
include_once 'cors_config.php';
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../connection.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['group_message_id'], $data['sender_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing fields']);
    exit;
}

$msgId = (int)$data['group_message_id'];
$senderId = (int)$data['sender_id'];
if ($msgId <= 0 || $senderId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid payload']);
    exit;
}

try {
    // Mark as unsent (retain original text similar to 1:1 behavior)
    $stmt = $conn->prepare("UPDATE tbl_comm_group_message SET is_unsent = 1 WHERE group_message_id = ? AND sender_id = ?");
    $stmt->execute([$msgId, $senderId]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
}