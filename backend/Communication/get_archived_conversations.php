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
    if ($userId <= 0) {
        throw new Exception('Missing user_id');
    }

    $sql = "
        SELECT u.user_id,
               u.user_role,
               u.user_firstname,
               u.user_middlename,
               u.user_lastname,
               u.user_email,
               u.user_photo,
               t.last_sent_at,
               r.role_name
        FROM (
            SELECT CASE WHEN c.sender_id = :uid THEN c.receiver_id ELSE c.sender_id END AS partner_id,
                   MAX(c.sent_at) AS last_sent_at
            FROM tbl_communication c
            WHERE (c.sender_id = :uid OR c.receiver_id = :uid) AND c.is_archived = 1
            GROUP BY CASE WHEN c.sender_id = :uid THEN c.receiver_id ELSE c.sender_id END
        ) t
        JOIN tbl_users u ON u.user_id = t.partner_id
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Active'
        ORDER BY t.last_sent_at DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process each user to include photo URLs
    foreach ($rows as &$row) {
        // Add photo field with exact same logic as get_users.php
        $row['user_photo'] = $row['user_photo'] ? 'http://localhost/capstone-project/backend/Uploads/' . $row['user_photo'] : 
                     (($row['role_name'] === 'Admin') ? 'http://localhost/capstone-project/backend/Uploads/default_admin.png' :
                      (($row['role_name'] === 'Teacher') ? 'http://localhost/capstone-project/backend/Uploads/default_teacher.png' :
                      (($row['role_name'] === 'Parent') ? 'http://localhost/capstone-project/backend/Uploads/default_parent.png' : 
                       'http://localhost/capstone-project/backend/Uploads/default_owner.png')));
    }

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
?>


