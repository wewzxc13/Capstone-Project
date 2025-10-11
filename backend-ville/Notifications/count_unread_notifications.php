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
    
    $totalUnread = 0;
    $breakdown = [];
    
         // For Admin and Super Admin, count unseen notifications using admin views table
     if ($userRole === 'SuperAdmin' || $userRole === 'Super Admin' || $userRole === 'Admin') {
        
        // Count unseen general meetings (meeting_id present AND meeting is "general": parent_id/student_id/advisory_id all NULL)
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS unseen_general
            FROM tbl_notifications n
            JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
            LEFT JOIN tbl_notification_admin_views v
              ON v.notification_id = n.notification_id AND v.user_id = ?
            WHERE v.notification_id IS NULL
              AND m.parent_id IS NULL AND m.student_id IS NULL AND m.advisory_id IS NULL
        ");
        $stmt->execute([$userId]);
        $generalMeetingsUnseen = $stmt->fetch(PDO::FETCH_ASSOC)['unseen_general'];
        $totalUnread += $generalMeetingsUnseen;
        $breakdown['general_meetings'] = $generalMeetingsUnseen;
        
        // Count unseen one-on-one meetings (meeting_id present AND meeting has parent_id or advisory_id)
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS unseen_one_on_one
            FROM tbl_notifications n
            JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
            LEFT JOIN tbl_notification_admin_views v
              ON v.notification_id = n.notification_id AND v.user_id = ?
            WHERE v.notification_id IS NULL
              AND (m.parent_id IS NOT NULL OR m.advisory_id IS NOT NULL)
        ");
        $stmt->execute([$userId]);
        $oneOnOneMeetingsUnseen = $stmt->fetch(PDO::FETCH_ASSOC)['unseen_one_on_one'];
        $totalUnread += $oneOnOneMeetingsUnseen;
        $breakdown['one_on_one_meetings'] = $oneOnOneMeetingsUnseen;
        
        // Count unseen progress notifications (meeting_id is NULL)
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS unseen_progress
            FROM tbl_notifications n
            LEFT JOIN tbl_notification_admin_views v
              ON v.notification_id = n.notification_id AND v.user_id = ?
            WHERE v.notification_id IS NULL
              AND n.meeting_id IS NULL
        ");
        $stmt->execute([$userId]);
        $progressUnseen = $stmt->fetch(PDO::FETCH_ASSOC)['unseen_progress'];
        $totalUnread += $progressUnseen;
        $breakdown['progress_notifications'] = $progressUnseen;
        
    } else if ($userRole === 'Teacher') {
        // For Teacher role, use the new read logic
        $totalUnread = 0;
        
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
        $progressUnseen = $stmt->fetch(PDO::FETCH_ASSOC)['unread_progress'];
        $totalUnread += $progressUnseen;
        $breakdown['progress_notifications'] = $progressUnseen;
        
    } else if ($userRole === 'Parent') {
        // Parent role unread counts
        $totalUnread = 0;
        
        // 1) General meetings via recipients table
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS unread_general
            FROM tbl_notifications n
            INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
            INNER JOIN tbl_notification_recipients nr ON nr.notification_id = n.notification_id
            WHERE nr.user_id = ?
              AND nr.recipient_type = 'Parent'
              AND m.parent_id IS NULL AND m.student_id IS NULL AND m.advisory_id IS NULL
              AND COALESCE(nr.is_read, 0) = 0
        ");
        $stmt->execute([$userId]);
        $generalUnread = (int)$stmt->fetch(PDO::FETCH_ASSOC)['unread_general'];
        $totalUnread += $generalUnread;
        $breakdown['general_meetings'] = $generalUnread;
        
        // 2) One-on-one meetings via tbl_meetings parent flags
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS unread_one_on_one
            FROM tbl_meetings
            WHERE parent_id = ? AND COALESCE(parent_is_read, 0) = 0
        ");
        $stmt->execute([$userId]);
        $oneOnOneUnread = (int)$stmt->fetch(PDO::FETCH_ASSOC)['unread_one_on_one'];
        $totalUnread += $oneOnOneUnread;
        $breakdown['one_on_one_meetings'] = $oneOnOneUnread;
        
        // 3) Progress notifications via tbl_progress_notification parent flags
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS unread_progress
            FROM tbl_progress_notification pn
            INNER JOIN tbl_students s ON s.student_id = pn.student_id
            WHERE s.parent_id = ? AND COALESCE(pn.parent_is_read, 0) = 0
        ");
        $stmt->execute([$userId]);
        $progressUnread = (int)$stmt->fetch(PDO::FETCH_ASSOC)['unread_progress'];
        $totalUnread += $progressUnread;
        $breakdown['progress_notifications'] = $progressUnread;
        
    } else {
        // For other roles, return 0 for now (will be implemented later)
        $totalUnread = 0;
        $breakdown = [
            'general_meetings' => 0,
            'one_on_one_meetings' => 0,
            'progress_notifications' => 0
        ];
    }
    
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
