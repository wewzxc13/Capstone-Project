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

    $userId = isset($payload['user_id']) ? (int)$payload['user_id'] : 0;
    $partnerId = isset($payload['partner_id']) ? (int)$payload['partner_id'] : 0;
    if ($userId <= 0 || $partnerId <= 0) {
        throw new Exception('Missing user_id or partner_id');
    }

    $stmt = $conn->prepare("UPDATE tbl_communication 
                             SET is_archived = 1 
                             WHERE is_archived = 0 AND 
                             (
                               (sender_id = :u AND receiver_id = :p) OR 
                               (sender_id = :p AND receiver_id = :u)
                             )");
    $stmt->bindValue(':u', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':p', $partnerId, PDO::PARAM_INT);
    $stmt->execute();

    $response['success'] = true;
    $response['data'] = [ 'affected' => $stmt->rowCount() ];
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


