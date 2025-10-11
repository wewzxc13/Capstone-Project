<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

try {
    // Fetch notifications from tbl_notifications
    $stmt = $conn->prepare("
        SELECT 
            n.notification_id,
            n.notif_message,
            n.created_by,
            n.created_at,
            n.meeting_id,
            m.meeting_title,
            m.meeting_start,
            m.meeting_end,
            m.meeting_status,
            m.parent_id,
            m.student_id,
            m.advisory_id
        FROM tbl_notifications n
        LEFT JOIN tbl_meetings m ON n.meeting_id = m.meeting_id
        ORDER BY n.created_at DESC
        LIMIT 100
    ");
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'notifications' => $notifications
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?> 