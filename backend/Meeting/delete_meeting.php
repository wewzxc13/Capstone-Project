<?php
// Prevent any HTML output that could corrupt JSON
error_reporting(E_ERROR | E_PARSE); // Only show critical errors
ini_set('display_errors', 0); // Don't display errors in output
ob_start(); // Start output buffering to catch any unexpected output

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json"); // Ensure JSON content type

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No input data']);
    exit;
}

$meeting_id = $data['meeting_id'] ?? null;
$created_by = $data['created_by'] ?? null;

if (!$meeting_id) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing meeting_id']);
    exit;
}

if (!$created_by) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing created_by (user id)']);
    exit;
}

try {
    $conn->beginTransaction();

    // First, verify the meeting exists and get its current status
    $stmt = $conn->prepare("SELECT meeting_status, meeting_title FROM tbl_meetings WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    $meeting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$meeting) {
        throw new Exception('Meeting not found');
    }
    
    // Only allow deletion of Completed or Cancelled meetings
    if (!in_array($meeting['meeting_status'], ['Completed', 'Cancelled'])) {
        throw new Exception('Only Completed or Cancelled meetings can be deleted');
    }
    
    // Get all notification IDs for this meeting
    $stmt = $conn->prepare("SELECT notification_id FROM tbl_notifications WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Step 1: Delete all notification recipients for this meeting
    if (!empty($notifications)) {
        $notification_ids = array_column($notifications, 'notification_id');
        $placeholders = str_repeat('?,', count($notification_ids) - 1) . '?';
        $stmt = $conn->prepare("DELETE FROM tbl_notification_recipients WHERE notification_id IN ($placeholders)");
        $stmt->execute($notification_ids);
    }
    
    // Step 2: Delete all notifications for this meeting
    $stmt = $conn->prepare("DELETE FROM tbl_notifications WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    
    // Step 3: Delete the meeting record
    $stmt = $conn->prepare("DELETE FROM tbl_meetings WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    
    $conn->commit();
    
    // Clean any unexpected output before sending JSON
    ob_clean();
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Meeting deleted successfully',
        'deleted_meeting' => [
            'meeting_id' => $meeting_id,
            'title' => $meeting['meeting_title'],
            'status' => $meeting['meeting_status']
        ]
    ]);
} catch (Exception $e) {
    // Only rollback if transaction is still active
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    
    // Clean any unexpected output before sending JSON
    ob_clean();
    
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>