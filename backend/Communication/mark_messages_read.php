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
    'data' => [],
    'error' => null,
];

try {
    if (!isset($conn) || !($conn instanceof PDO)) {
        throw new Exception(isset($connection_error) ? $connection_error : 'Database connection not available');
    }

    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $partnerId = isset($input['partner_id']) ? (int)$input['partner_id'] : 0;
    
    if ($userId <= 0 || $partnerId <= 0) {
        throw new Exception('Missing user_id or partner_id');
    }

    // Mark all unread messages from partner to user as read
    $sql = "UPDATE tbl_communication 
            SET is_read = 1 
            WHERE receiver_id = :user_id 
              AND sender_id = :partner_id 
              AND is_read = 0";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':partner_id', $partnerId, PDO::PARAM_INT);
    $stmt->execute();
    
    $affectedRows = $stmt->rowCount();
    
    error_log("Marked $affectedRows messages as read for user $userId from partner $partnerId");

    $response['success'] = true;
    $response['data'] = [
        'affected_rows' => $affectedRows,
        'user_id' => $userId,
        'partner_id' => $partnerId
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
?>
