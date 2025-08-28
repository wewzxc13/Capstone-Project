<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json; charset=utf-8');

// Never leak warnings/notices into the HTTP response (keeps JSON clean)
if (function_exists('ini_set')) {
    @ini_set('display_errors', '0');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

// Check if there was a connection error
if (isset($connection_error)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $connection_error
    ]);
    exit;
}

$meeting_id = $_GET['meeting_id'] ?? null;
if (!$meeting_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing meeting_id']);
    exit;
}

try {
    // Optional debug logging without emitting warnings when folder is missing
    $debugLogPath = __DIR__ . '/../SystemLogs/debug_log.txt';
    $debugDir = dirname($debugLogPath);
    if (is_dir($debugDir) && is_writable($debugDir)) {
        @file_put_contents($debugLogPath, date('Y-m-d H:i:s') . " - get_notification_recipients.php meeting_id: $meeting_id\n", FILE_APPEND);
    }

    // 1. Get notification_id for this meeting
    $stmt = $conn->prepare("SELECT notification_id FROM tbl_notifications WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $notification_id = $row['notification_id'] ?? null;
    // Debug: Log found notification_id
    if (is_dir($debugDir) && is_writable($debugDir)) {
        @file_put_contents($debugLogPath, date('Y-m-d H:i:s') . " - get_notification_recipients.php notification_id: " . ($notification_id ?? 'none') . "\n", FILE_APPEND);
    }

    if (!$notification_id) {
        echo json_encode(['status' => 'success', 'teachers' => [], 'parents' => []]);
        exit;
    }

    // 2. Get recipients for this notification
    $stmt = $conn->prepare("
        SELECT r.user_id, r.recipient_type, u.user_firstname, u.user_middlename, u.user_lastname
        FROM tbl_notification_recipients r
        JOIN tbl_users u ON r.user_id = u.user_id
        WHERE r.notification_id = ?
    ");
    $stmt->execute([$notification_id]);
    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Debug: Log recipients array
    if (is_dir($debugDir) && is_writable($debugDir)) {
        @file_put_contents($debugLogPath, date('Y-m-d H:i:s') . " - get_notification_recipients.php recipients: " . json_encode($recipients) . "\n", FILE_APPEND);
    }

    $teachers = [];
    $parents = [];
    foreach ($recipients as $r) {
        $user = [
            'user_id' => $r['user_id'],
            'user_firstname' => $r['user_firstname'],
            'user_middlename' => $r['user_middlename'],
            'user_lastname' => $r['user_lastname']
        ];
        if ($r['recipient_type'] === 'Teacher') {
            $teachers[] = $user;
        } else if ($r['recipient_type'] === 'Parent') {
            $parents[] = $user;
        }
    }

    echo json_encode([
        'status' => 'success',
        'teachers' => $teachers,
        'parents' => $parents
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error', 'error' => $e->getMessage()]);
}