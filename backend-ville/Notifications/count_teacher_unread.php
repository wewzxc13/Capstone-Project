<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

include_once '../connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['user_id']) || !isset($input['user_role'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
        exit;
    }
    
    $userId = $input['user_id'];
    $userRole = $input['user_role'];
    
    // Only allow Teacher role
    if ($userRole !== 'Teacher') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Access denied. Only teachers can view this data.']);
        exit;
    }
    
    $totalUnread = 0;
    $breakdown = [];
    
    // 1. Count unread general meetings (from tbl_notification_recipients)
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS unread_general
        FROM tbl_notifications n
        INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
        INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
        WHERE nr.user_id = ? 
        AND nr.recipient_type = 'Teacher'
        AND m.parent_id IS NULL 
        AND m.student_id IS NULL 
        AND m.advisory_id IS NULL
        AND nr.is_read = 0
    ");
    $stmt->execute([$userId]);
    $generalMeetingsUnread = $stmt->fetch(PDO::FETCH_ASSOC)['unread_general'];
    $totalUnread += $generalMeetingsUnread;
    $breakdown['general_meetings'] = $generalMeetingsUnread;
    
    // 2. Count unread one-on-one meetings (from tbl_meetings per-role flags)
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS unread_one_on_one
        FROM tbl_notifications n
        INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
        INNER JOIN tbl_advisory a ON a.advisory_id = m.advisory_id
        WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
        AND (m.parent_id IS NOT NULL OR m.student_id IS NOT NULL OR m.advisory_id IS NOT NULL)
        AND (
            (a.lead_teacher_id = ? AND m.lead_is_read = 0) OR
            (a.assistant_teacher_id = ? AND m.assistant_is_read = 0)
        )
    ");
    $stmt->execute([$userId, $userId, $userId, $userId]);
    $oneOnOneMeetingsUnread = $stmt->fetch(PDO::FETCH_ASSOC)['unread_one_on_one'];
    $totalUnread += $oneOnOneMeetingsUnread;
    $breakdown['one_on_one_meetings'] = $oneOnOneMeetingsUnread;
    
    // 3. Count unread progress notifications (from tbl_progress_notification per-role flags)
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS unread_progress
        FROM tbl_notifications n
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        INNER JOIN tbl_students s ON pn.student_id = s.student_id
        INNER JOIN tbl_advisory a ON a.level_id = s.level_id
        WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
        AND n.meeting_id IS NULL
        AND (
            (a.lead_teacher_id = ? AND pn.lead_is_read = 0) OR
            (a.assistant_teacher_id = ? AND pn.assistant_is_read = 0)
        )
    ");
    $stmt->execute([$userId, $userId, $userId, $userId]);
    $progressUnread = $stmt->fetch(PDO::FETCH_ASSOC)['unread_progress'];
    $totalUnread += $progressUnread;
    $breakdown['progress_notifications'] = $progressUnread;
    
    // 4. Count unread quarterly progress notifications specifically
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS unread_quarterly
        FROM tbl_notifications n
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        INNER JOIN tbl_students s ON pn.student_id = s.student_id
        INNER JOIN tbl_advisory a ON a.level_id = s.level_id
        WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
        AND n.meeting_id IS NULL
        AND n.notif_message LIKE '%[QUARTERLY PROGRESS]%'
        AND (
            (a.lead_teacher_id = ? AND pn.lead_is_read = 0) OR
            (a.assistant_teacher_id = ? AND pn.assistant_is_read = 0)
        )
    ");
    $stmt->execute([$userId, $userId, $userId, $userId]);
    $quarterlyProgressUnread = $stmt->fetch(PDO::FETCH_ASSOC)['unread_quarterly'];
    $breakdown['quarterly_progress'] = $quarterlyProgressUnread;
    
    // 5. Count unread overall progress notifications specifically
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS unread_overall
        FROM tbl_notifications n
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        INNER JOIN tbl_students s ON pn.student_id = s.student_id
        INNER JOIN tbl_advisory a ON a.level_id = s.level_id
        WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
        AND n.meeting_id IS NULL
        AND n.notif_message LIKE '%[OVERALL PROGRESS]%'
        AND (
            (a.lead_teacher_id = ? AND pn.lead_is_read = 0) OR
            (a.assistant_teacher_id = ? AND pn.assistant_is_read = 0)
        )
    ");
    $stmt->execute([$userId, $userId, $userId, $userId]);
    $overallProgressUnread = $stmt->fetch(PDO::FETCH_ASSOC)['unread_overall'];
    $breakdown['overall_progress'] = $overallProgressUnread;
    
    echo json_encode([
        'status' => 'success',
        'total_unread' => $totalUnread,
        'breakdown' => $breakdown
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>
