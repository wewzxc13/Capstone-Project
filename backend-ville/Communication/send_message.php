<?php
// Start output buffering to ensure clean JSON output
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

@ini_set('display_errors', '0');
@error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

include_once '../connection.php';

$response = [
    'success' => false,
    'data' => null,
    'error' => null,
];

try {
    if (!isset($conn) || !($conn instanceof PDO)) {
        throw new Exception(isset($connection_error) ? $connection_error : 'Database connection not available');
    }

    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        throw new Exception('Invalid JSON payload');
    }

    $senderId = isset($payload['sender_id']) ? (int)$payload['sender_id'] : 0;
    $receiverId = isset($payload['receiver_id']) ? (int)$payload['receiver_id'] : 0;
    $messageText = isset($payload['message_text']) ? trim($payload['message_text']) : '';

    if ($senderId <= 0 || $receiverId <= 0 || $messageText === '') {
        throw new Exception('Missing required fields: sender_id, receiver_id, message_text');
    }

    $stmt = $conn->prepare("INSERT INTO tbl_communication (sender_id, receiver_id, message_text, is_read, sent_at, is_archived)
                             VALUES (:sender_id, :receiver_id, :message_text, 0, CURRENT_TIMESTAMP(), 0)");
    $stmt->bindValue(':sender_id', $senderId, PDO::PARAM_INT);
    $stmt->bindValue(':receiver_id', $receiverId, PDO::PARAM_INT);
    $stmt->bindValue(':message_text', $messageText, PDO::PARAM_STR);
    $stmt->execute();

    $insertId = (int)$conn->lastInsertId();
    // Retrieve the inserted row's timestamp
    $tsStmt = $conn->prepare('SELECT sent_at FROM tbl_communication WHERE message_id = :id');
    $tsStmt->bindValue(':id', $insertId, PDO::PARAM_INT);
    $tsStmt->execute();
    $row = $tsStmt->fetch(PDO::FETCH_ASSOC);

    $response['success'] = true;
    $response['data'] = [
        'message_id' => $insertId,
        'sent_at' => $row ? $row['sent_at'] : null,
    ];

    if (ob_get_length()) { ob_clean(); }
    $json = json_encode($response);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
} catch (Throwable $e) {
    if (ob_get_length()) { ob_clean(); }
    http_response_code(500);
    $response['error'] = 'Server error: ' . $e->getMessage();
    $json = json_encode($response);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
}