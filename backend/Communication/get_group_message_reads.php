
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../connection.php';

$groupMessageId = isset($_GET['group_message_id']) ? intval($_GET['group_message_id']) : 0;
if ($groupMessageId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Missing group_message_id']);
    exit;
}

try {
    // Some installs may insert multiple read rows per user; show the latest per user
    $sql = "
        SELECT 
            r.group_message_id,
            r.user_id,
            MAX(r.read_at) AS read_at,
            u.user_role,
            COALESCE(rn.role_name, '') AS role_name,
            TRIM(CONCAT(u.user_firstname, ' ', COALESCE(u.user_middlename, ''), ' ', u.user_lastname)) AS full_name,
            u.user_firstname,
            u.user_middlename,
            u.user_lastname
        FROM tbl_comm_group_read r
        INNER JOIN tbl_users u ON u.user_id = r.user_id
        LEFT JOIN tbl_roles rn ON rn.role_id = u.user_role
        WHERE r.group_message_id = ?
        GROUP BY r.group_message_id, r.user_id, u.user_role, rn.role_name, u.user_firstname, u.user_middlename, u.user_lastname
        ORDER BY u.user_role ASC, full_name ASC
    ";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$groupMessageId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $rows]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
}
?>


