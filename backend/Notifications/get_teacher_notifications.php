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
    
    $notifications = [];
    
    // 1. Get general meeting notifications (from tbl_notification_recipients)
    $generalMeetingStmt = $conn->prepare("
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
            m.advisory_id,
            nr.is_read,
            nr.read_at,
            'general_meeting' AS notification_type
        FROM tbl_notifications n
        INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
        INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
        WHERE nr.user_id = ? 
        AND nr.recipient_type = 'Teacher'
        AND m.parent_id IS NULL 
        AND m.student_id IS NULL 
        AND m.advisory_id IS NULL
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    
    $generalMeetingStmt->execute([$userId]);
    $generalMeetingNotifications = $generalMeetingStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Get one-on-one meeting notifications (from tbl_meetings per-role flags)
    $oneOnOneMeetingStmt = $conn->prepare("
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
            m.advisory_id,
            CASE 
                WHEN a.lead_teacher_id = ? THEN m.lead_is_read
                WHEN a.assistant_teacher_id = ? THEN m.assistant_is_read
                ELSE 0
            END AS is_read,
            CASE 
                WHEN a.lead_teacher_id = ? THEN m.lead_read_at
                WHEN a.assistant_teacher_id = ? THEN m.assistant_read_at
                ELSE NULL
            END AS read_at,
            'one_on_one_meeting' AS notification_type
        FROM tbl_notifications n
        INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
        INNER JOIN tbl_advisory a ON a.advisory_id = m.advisory_id
        WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
        AND (m.parent_id IS NOT NULL OR m.student_id IS NOT NULL OR m.advisory_id IS NOT NULL)
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    
    $oneOnOneMeetingStmt->execute([$userId, $userId, $userId, $userId, $userId, $userId]);
    $oneOnOneMeetingNotifications = $oneOnOneMeetingStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Get progress notifications (from tbl_progress_notification per-role flags)
    $progressStmt = $conn->prepare("
        SELECT 
            n.notification_id,
            n.notif_message,
            n.created_by,
            n.created_at,
            pn.student_id,
            pn.quarter_id,
            q.quarter_name,
            s.stud_firstname,
            s.stud_middlename,
            s.stud_lastname,
            CASE 
                WHEN a.lead_teacher_id = ? THEN pn.lead_is_read
                WHEN a.assistant_teacher_id = ? THEN pn.assistant_is_read
                ELSE 0
            END AS is_read,
            CASE 
                WHEN a.lead_teacher_id = ? THEN pn.lead_read_at
                WHEN a.assistant_teacher_id = ? THEN pn.assistant_read_at
                ELSE NULL
            END AS read_at,
            CASE 
                WHEN n.notif_message LIKE '%[QUARTERLY PROGRESS]%' THEN 'quarterly_progress'
                WHEN n.notif_message LIKE '%[OVERALL PROGRESS]%' THEN 'overall_progress'
                ELSE 'progress'
            END AS notification_type
        FROM tbl_notifications n
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        INNER JOIN tbl_students s ON pn.student_id = s.student_id
        INNER JOIN tbl_advisory a ON a.level_id = s.level_id
        LEFT JOIN tbl_quarters q ON pn.quarter_id = q.quarter_id
        WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
        AND n.meeting_id IS NULL
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    
    $progressStmt->execute([$userId, $userId, $userId, $userId, $userId, $userId]);
    $progressNotifications = $progressStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine all notifications
    $allNotifications = array_merge($generalMeetingNotifications, $oneOnOneMeetingNotifications, $progressNotifications);
    
    // Sort by created_at DESC
    usort($allNotifications, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    // Process and format notifications
    foreach ($allNotifications as $notification) {
        // Add read status
        $notification['is_read'] = (bool)$notification['is_read'];
        $notification['read_status'] = $notification['is_read'] ? 'read' : 'unread';
        
        // Add student name for progress notifications
        if (isset($notification['stud_firstname'])) {
            $firstName = $notification['stud_firstname'] ?? '';
            $middleName = $notification['stud_middlename'] ?? '';
            $lastName = $notification['stud_lastname'] ?? '';
            $notification['student_name'] = trim($firstName . ' ' . $middleName . ' ' . $lastName);
        }
        
        $notifications[] = $notification;
    }
    
    // Calculate counts
    $totalCount = count($notifications);
    $unreadCount = count(array_filter($notifications, function($n) { 
        return !$n['is_read']; 
    }));
    $readCount = count(array_filter($notifications, function($n) { 
        return $n['is_read']; 
    }));
    
    // Category breakdown
    $categoryBreakdown = [
        'general_meetings' => count(array_filter($notifications, function($n) { 
            return $n['notification_type'] === 'general_meeting'; 
        })),
        'one_on_one_meetings' => count(array_filter($notifications, function($n) { 
            return $n['notification_type'] === 'one_on_one_meeting'; 
        })),
        'quarterly_progress' => count(array_filter($notifications, function($n) { 
            return $n['notification_type'] === 'quarterly_progress'; 
        })),
        'overall_progress' => count(array_filter($notifications, function($n) { 
            return $n['notification_type'] === 'overall_progress'; 
        }))
    ];
    
    echo json_encode([
        'status' => 'success',
        'notifications' => $notifications,
        'total_count' => $totalCount,
        'unread_count' => $unreadCount,
        'read_count' => $readCount,
        'category_breakdown' => $categoryBreakdown
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
