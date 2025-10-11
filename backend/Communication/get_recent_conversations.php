<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');

// Dynamic CORS configuration
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://learnersville.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
];

if (in_array($origin, $allowedOrigins) || preg_match('/^http:\/\/localhost:3[0-9]{3}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

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

    // User id is required
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        throw new Exception('Missing user_id');
    }

    // Find distinct conversation partners for the given user and their latest sent_at
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
            WHERE (c.sender_id = :uid OR c.receiver_id = :uid) AND c.is_archived = 0
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
    
    // Process each user to handle photo URLs and defaults
    foreach ($rows as $key => &$row) {
        if (!empty($row['user_photo'])) {
            // Clean up photo path - extract filename only
            $parts = explode('/', (string)$row['user_photo']);
            $row['user_photo'] = end($parts);
        } else {
            // Set default photo based on role
            if ($row['role_name'] === 'Admin' || $row['role_name'] === 'SuperAdmin') {
                $row['user_photo'] = 'default_admin.png';
            } else if ($row['role_name'] === 'Teacher') {
                $row['user_photo'] = 'default_teacher.png';
            } else if ($row['role_name'] === 'Parent') {
                $row['user_photo'] = 'default_parent.png';
            } else {
                $row['user_photo'] = 'default_owner.png';
            }
        }
    }
    unset($row);

    // Enrich with latest message text for each partner (excluding unsent),
    // so the client can show a preview in the recents list
    $lastMsgStmt = $conn->prepare(
        "SELECT message_text, is_unsent, sent_at, sender_id \n"
        . "FROM tbl_communication \n"
        . "WHERE ((sender_id = :uid AND receiver_id = :pid) OR (sender_id = :pid AND receiver_id = :uid)) \n"
        . "AND is_archived = 0 \n"
        . "ORDER BY sent_at DESC, message_id DESC LIMIT 1"
    );
    $unreadStmt = $conn->prepare(
        "SELECT COUNT(*) AS unread_count FROM tbl_communication WHERE receiver_id = :uid AND sender_id = :pid AND is_read = 0 AND is_archived = 0"
    );
    $nameStmt = $conn->prepare("SELECT user_firstname, user_middlename, user_lastname FROM tbl_users WHERE user_id = ? LIMIT 1");

    foreach ($rows as &$row) {
        $partnerId = (int)$row['user_id'];
        $lastMsgStmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $lastMsgStmt->bindValue(':pid', $partnerId, PDO::PARAM_INT);
        $lastMsgStmt->execute();
        $m = $lastMsgStmt->fetch(PDO::FETCH_ASSOC);
        if ($m) {
            $isOwn = ((int)$m['sender_id'] === $userId);
            $row['last_sender_id'] = (int)$m['sender_id']; // Add this field for frontend logic
            
            if ((int)$m['is_unsent'] === 1) {
                // When message is unsent, show who unsent it
                if ($isOwn) {
                    $row['last_message'] = 'You unsent a message';
                } else {
                    // Get the partner's name for the preview
                    $nameStmt->execute([$partnerId]);
                    $partnerName = $nameStmt->fetch(PDO::FETCH_ASSOC);
                    $fullName = trim(implode(' ', array_filter([
                        $partnerName['user_firstname'] ?? '',
                        $partnerName['user_middlename'] ?? '',
                        $partnerName['user_lastname'] ?? ''
                    ])));
                    $row['last_message'] = $fullName ? $fullName . ' unsent a message' : 'Unsent a message';
                }
            } else {
                $row['last_message'] = $isOwn ? ('You: ' . (string)$m['message_text']) : (string)$m['message_text'];
            }
        } else {
            $row['last_message'] = '';
            $row['last_sender_id'] = null;
        }
        // If for some reason last_sent_at is missing, backfill from the message
        if (empty($row['last_sent_at']) && $m && !empty($m['sent_at'])) {
            $row['last_sent_at'] = $m['sent_at'];
        }

        // Unread count for messages from partner -> current user
        $unreadStmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $unreadStmt->bindValue(':pid', $partnerId, PDO::PARAM_INT);
        $unreadStmt->execute();
        $cnt = (int)($unreadStmt->fetchColumn());
        $row['unread_count'] = $cnt;
    }
    unset($row);

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