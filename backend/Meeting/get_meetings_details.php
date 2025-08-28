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

// Check if there was a connection error
if (isset($connection_error)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $connection_error
    ]);
    exit;
}

// Auto-update meeting_status to 'Completed' for meetings whose end time has passed
try {
    $now = date('Y-m-d H:i:s');
    $updateStmt = $conn->prepare("UPDATE tbl_meetings SET meeting_status = 'Completed' WHERE meeting_end < ? AND meeting_status != 'Completed'");
    $updateStmt->execute([$now]);
} catch (PDOException $e) {
    // Optionally log error, but do not block the rest of the script
}

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
$parent_only = isset($_GET['parent_only']) ? intval($_GET['parent_only']) : 0;

try {
    if ($user_id && $parent_only) {
        // Only meetings where user is a recipient as Parent
        $stmt = $conn->prepare("
            SELECT m.meeting_id, m.meeting_title, m.parent_id, m.student_id, m.advisory_id, m.meeting_start, m.meeting_end, m.meeting_agenda, m.meeting_status,
                (
                    SELECT n2.created_by
                    FROM tbl_notifications n2
                    WHERE n2.meeting_id = m.meeting_id
                    ORDER BY n2.created_at DESC, n2.notification_id DESC
                    LIMIT 1
                ) as created_by,
                (
                    SELECT n2.created_at
                    FROM tbl_notifications n2
                    WHERE n2.meeting_id = m.meeting_id
                    ORDER BY n2.created_at DESC, n2.notification_id DESC
                    LIMIT 1
                ) as created_at
            FROM tbl_meetings m
            JOIN tbl_notifications n ON n.meeting_id = m.meeting_id
            JOIN tbl_notification_recipients r ON r.notification_id = n.notification_id
            WHERE r.user_id = ? AND r.recipient_type = 'Parent'
            GROUP BY m.meeting_id
            ORDER BY m.meeting_start DESC
        ");
        $stmt->execute([$user_id]);
    } else if ($user_id) {
        // Meetings where user is a recipient (Teacher or Parent), creator, or co-advisor (lead/assistant)
        $stmt = $conn->prepare("
            SELECT m.meeting_id, m.meeting_title, m.parent_id, m.student_id, m.advisory_id, m.meeting_start, m.meeting_end, m.meeting_agenda, m.meeting_status,
                (
                    SELECT n2.created_by
                    FROM tbl_notifications n2
                    WHERE n2.meeting_id = m.meeting_id
                    ORDER BY n2.created_at DESC, n2.notification_id DESC
                    LIMIT 1
                ) as created_by,
                (
                    SELECT n2.created_at
                    FROM tbl_notifications n2
                    WHERE n2.meeting_id = m.meeting_id
                    ORDER BY n2.created_at DESC, n2.notification_id DESC
                    LIMIT 1
                ) as created_at
            FROM tbl_meetings m
            LEFT JOIN tbl_notifications n ON n.meeting_id = m.meeting_id
            LEFT JOIN tbl_notification_recipients r ON r.notification_id = n.notification_id AND (r.recipient_type = 'Teacher' OR r.recipient_type = 'Parent')
            LEFT JOIN tbl_advisory a ON m.advisory_id = a.advisory_id
            WHERE (
                (r.user_id = ?)
                OR ((SELECT n2.created_by FROM tbl_notifications n2 WHERE n2.meeting_id = m.meeting_id ORDER BY n2.created_at DESC, n2.notification_id DESC LIMIT 1) = ?)
                OR (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
            )
            GROUP BY m.meeting_id
            ORDER BY m.meeting_start DESC
        ");
        $stmt->execute([$user_id, $user_id, $user_id, $user_id]);
    } else {
        // Fallback: all meetings
        $stmt = $conn->prepare("
            SELECT meeting_id, meeting_title, parent_id, student_id, advisory_id, meeting_start, meeting_end, meeting_agenda, meeting_status,
                (
                    SELECT n2.created_by
                    FROM tbl_notifications n2
                    WHERE n2.meeting_id = tbl_meetings.meeting_id
                    ORDER BY n2.created_at DESC, n2.notification_id DESC
                    LIMIT 1
                ) as created_by,
                (
                    SELECT n2.created_at
                    FROM tbl_notifications n2
                    WHERE n2.meeting_id = tbl_meetings.meeting_id
                    ORDER BY n2.created_at DESC, n2.notification_id DESC
                    LIMIT 1
                ) as created_at
            FROM tbl_meetings
            ORDER BY meeting_start DESC
        ");
        $stmt->execute();
    }
    $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'meetings' => $meetings
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
}
?> 