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
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../connection.php';

$groupId = isset($_GET['group_id']) ? intval($_GET['group_id']) : 0;
$userId  = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
if ($groupId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Missing group_id']);
    exit;
}

try {
    // Fetch messages with sender name, sender role and edited flag
    $stmt = $conn->prepare("SELECT gm.group_message_id, gm.group_id, gm.sender_id, gm.message_text, gm.sent_at, gm.is_unsent, gm.is_edited,
                                   u.user_role AS sender_role,
                                   CONCAT(u.user_firstname, ' ', COALESCE(u.user_middlename,''), ' ', u.user_lastname) AS sender_name
                             FROM tbl_comm_group_message gm
                             LEFT JOIN tbl_users u ON u.user_id = gm.sender_id
                             WHERE gm.group_id = ?
                             ORDER BY gm.sent_at ASC");
    $stmt->execute([$groupId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Mark all as read for this user (if provided)
    if ($userId > 0) {
        $ins = $conn->prepare("INSERT IGNORE INTO tbl_comm_group_read(group_message_id, user_id, read_at) VALUES(?, ?, NOW())");
        foreach ($rows as $r) {
            $ins->execute([$r['group_message_id'], $userId]);
        }
    }

    echo json_encode(['success' => true, 'data' => $rows]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
}