<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    'data' => [],
    'error' => null,
];

try {
    if (!isset($conn) || !($conn instanceof PDO)) {
        throw new Exception(isset($connection_error) ? $connection_error : 'Database connection not available');
    }

    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    $partnerId = isset($_GET['partner_id']) ? (int)$_GET['partner_id'] : 0;
    if ($userId <= 0 || $partnerId <= 0) {
        throw new Exception('Missing user_id or partner_id');
    }

    $sql = "SELECT message_id, sender_id, receiver_id, message_text, is_read, is_unsent, is_edited, sent_at
            FROM tbl_communication
            WHERE (sender_id = :u AND receiver_id = :p)
               OR (sender_id = :p AND receiver_id = :u)
            ORDER BY sent_at ASC, message_id ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':u', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':p', $partnerId, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Mark partner->user messages as read (like group read behavior)
    // Any messages sent by partner to the current user that are not yet read become read now
    $upd = $conn->prepare("UPDATE tbl_communication
                           SET is_read = 1
                           WHERE receiver_id = :u AND sender_id = :p AND is_read = 0");
    $upd->execute([':u' => $userId, ':p' => $partnerId]);

    $response['success'] = true;
    $response['data'] = $rows;
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