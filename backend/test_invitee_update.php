<?php
// Prevent any HTML output that could corrupt JSON
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 0);
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection safely
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "dblearnsville";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    error_log("test_invitee_update.php: Database connected successfully");
} catch(PDOException $e) {
    error_log("test_invitee_update.php: Database connection failed: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Log start of script
error_log("test_invitee_update.php: Script started");

try {
    $response = ['status' => 'success'];
    
    // Get meeting ID from query params
    $meeting_id = $_GET['meeting_id'] ?? null;
    
    if (!$meeting_id) {
        error_log("test_invitee_update.php: Missing meeting_id");
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Meeting ID is required',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
    
    error_log("test_invitee_update.php: Processing meeting_id: " . $meeting_id);
    
    // Test 1: Get current meeting details
    $stmt = $conn->prepare("SELECT meeting_id, meeting_title, meeting_agenda, meeting_start, meeting_end, meeting_status FROM tbl_meetings WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    $meeting = $stmt->fetch(PDO::FETCH_ASSOC);
    $response['meeting_details'] = $meeting;
    
    // Test 2: Get current notification recipients
    // First get notification_id for this meeting
    $stmt = $conn->prepare("SELECT notification_id FROM tbl_notifications WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    $notification_row = $stmt->fetch(PDO::FETCH_ASSOC);
    $notification_id = $notification_row['notification_id'] ?? null;
    
    $recipients = [];
    if ($notification_id) {
        $stmt = $conn->prepare("
            SELECT 
                nr.user_id,
                nr.recipient_type,
                u.user_firstname,
                u.user_lastname,
                u.user_status
            FROM tbl_notification_recipients nr
            LEFT JOIN tbl_users u ON nr.user_id = u.user_id
            WHERE nr.notification_id = ?
            ORDER BY nr.recipient_type, u.user_firstname
        ");
        $stmt->execute([$notification_id]);
        $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    $response['current_recipients'] = $recipients;
    $response['notification_id'] = $notification_id;
    
    // Test 3: Get all active users that could be invited
    $stmt = $conn->prepare("
        SELECT 
            user_id,
            user_firstname,
            user_lastname,
            user_role,
            user_status
        FROM tbl_users 
        WHERE TRIM(LOWER(user_status)) = 'active'
        AND user_role IN ('Teacher', 'Parent')
        ORDER BY user_role, user_firstname
    ");
    $stmt->execute();
    $available_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $response['available_users'] = $available_users;
    
    // Test 4: Check if there are any recent updates to this meeting
    $stmt = $conn->prepare("
        SELECT 
            meeting_id,
            meeting_title,
            meeting_agenda,
            meeting_start,
            meeting_end,
            meeting_status
        FROM tbl_meetings 
        WHERE meeting_id = ?
    ");
    $stmt->execute([$meeting_id]);
    $meeting_info = $stmt->fetch(PDO::FETCH_ASSOC);
    $response['meeting_info'] = $meeting_info;
    
    // Test 5: Get notification history for this meeting
    $stmt = $conn->prepare("
        SELECT 
            notification_id,
            meeting_id,
            notif_message,
            created_at
        FROM tbl_notifications 
        WHERE meeting_id = ?
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$meeting_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $response['notification_history'] = $notifications;
    
    $response['timestamp'] = date('Y-m-d H:i:s');
    $response['debug_info'] = [
        'meeting_id' => $meeting_id,
        'recipients_count' => count($recipients),
        'available_users_count' => count($available_users)
    ];
    
    error_log("test_invitee_update.php: About to send JSON response");
    ob_clean();
    echo json_encode($response, JSON_PRETTY_PRINT);
    error_log("test_invitee_update.php: JSON response sent");
    
} catch (PDOException $e) {
    error_log("test_invitee_update.php: PDO Error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("test_invitee_update.php: Exception: " . $e->getMessage());
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>