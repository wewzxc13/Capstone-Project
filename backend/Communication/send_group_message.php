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
if (!$data || !isset($data['group_id'], $data['sender_id'], $data['message_text'])) {
    echo json_encode(['success' => false, 'error' => 'Missing fields']);
    exit;
}

$groupId = (int)$data['group_id'];
$senderId = (int)$data['sender_id'];
$text = trim((string)$data['message_text']);
if ($groupId <= 0 || $senderId <= 0 || $text === '') {
    echo json_encode(['success' => false, 'error' => 'Invalid payload']);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO tbl_comm_group_message (group_id, sender_id, message_text) VALUES (?, ?, ?)");
    $stmt->execute([$groupId, $senderId, $text]);
    $id = (int)$conn->lastInsertId();

    $row = $conn->prepare("SELECT group_message_id, group_id, sender_id, message_text, sent_at, is_unsent FROM tbl_comm_group_message WHERE group_message_id = ?");
    $row->execute([$id]);
    $msg = $row->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $msg]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
}