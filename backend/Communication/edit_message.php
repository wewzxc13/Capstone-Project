<?php
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

    $messageId = isset($payload['message_id']) ? (int)$payload['message_id'] : 0;
    $senderId = isset($payload['sender_id']) ? (int)$payload['sender_id'] : 0;
    $messageText = isset($payload['message_text']) ? trim($payload['message_text']) : '';
    $isEdited = isset($payload['is_edited']) ? (int)$payload['is_edited'] : 1; // default to 1 when editing

    if ($messageId <= 0 || $senderId <= 0 || $messageText === '') {
        throw new Exception('Missing required fields: message_id, sender_id, message_text');
    }

    // Only allow editing own messages; clear unsent and set edited flag
    $stmt = $conn->prepare("UPDATE tbl_communication SET message_text = :message_text, is_unsent = 0, is_edited = :is_edited WHERE message_id = :message_id AND sender_id = :sender_id");
    $stmt->bindValue(':message_text', $messageText, PDO::PARAM_STR);
    $stmt->bindValue(':is_edited', $isEdited, PDO::PARAM_INT);
    $stmt->bindValue(':message_id', $messageId, PDO::PARAM_INT);
    $stmt->bindValue(':sender_id', $senderId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        throw new Exception('Not allowed or message not found');
    }

    $response['success'] = true;
    $response['data'] = [ 'message_id' => $messageId, 'is_edited' => (int)$isEdited ];
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
?>


