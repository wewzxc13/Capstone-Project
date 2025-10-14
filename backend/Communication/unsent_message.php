<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');

// Include dynamic CORS configuration
include_once 'cors_config.php';
header('Access-Control-Allow-Methods: POST, OPTIONS');

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

    $messageId = isset($payload['message_id']) ? (int)$payload['message_id'] : 0;
    $senderId = isset($payload['sender_id']) ? (int)$payload['sender_id'] : 0;

    if ($messageId <= 0 || $senderId <= 0) {
        throw new Exception('Missing required fields: message_id, sender_id');
    }

    $stmt = $conn->prepare("UPDATE tbl_communication SET is_unsent = 1 WHERE message_id = :message_id AND sender_id = :sender_id AND is_unsent = 0");
    $stmt->bindValue(':message_id', $messageId, PDO::PARAM_INT);
    $stmt->bindValue(':sender_id', $senderId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        throw new Exception('Not allowed or message already unsent');
    }

    $response['success'] = true;
    $response['data'] = [ 'message_id' => $messageId ];
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