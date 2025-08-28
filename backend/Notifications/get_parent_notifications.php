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
    
    if ($userRole !== 'Parent') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Access denied. Only parents can view this data.']);
        exit;
    }
    
    $notifications = [];
    
    // 1) General meetings via recipients table
    $generalStmt = $conn->prepare("
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
        WHERE nr.user_id = ? AND nr.recipient_type = 'Parent'
          AND m.parent_id IS NULL AND m.student_id IS NULL AND m.advisory_id IS NULL
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    $generalStmt->execute([$userId]);
    $general = $generalStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 2) One-on-one meetings via tbl_meetings parent flags
    $oneOnOneStmt = $conn->prepare("
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
            m.parent_is_read AS is_read,
            m.parent_read_at AS read_at,
            'one_on_one_meeting' AS notification_type
        FROM tbl_notifications n
        INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
        WHERE m.parent_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    $oneOnOneStmt->execute([$userId]);
    $oneOnOne = $oneOnOneStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3) Progress notifications via tbl_progress_notification parent flags
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
            pn.parent_is_read AS is_read,
            pn.parent_read_at AS read_at,
            CASE 
                WHEN n.notif_message LIKE '%[QUARTERLY PROGRESS]%' THEN 'quarterly_progress'
                WHEN n.notif_message LIKE '%[OVERALL PROGRESS]%' THEN 'overall_progress'
                ELSE 'progress'
            END AS notification_type
        FROM tbl_notifications n
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        INNER JOIN tbl_students s ON pn.student_id = s.student_id
        LEFT JOIN tbl_quarters q ON pn.quarter_id = q.quarter_id
        WHERE s.parent_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    $progressStmt->execute([$userId]);
    $progress = $progressStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $all = array_merge($general, $oneOnOne, $progress);
    usort($all, function($a, $b) { return strtotime($b['created_at']) - strtotime($a['created_at']); });
    
    foreach ($all as $n) {
        // Fold in student name if present
        if (isset($n['stud_firstname'])) {
            $first = $n['stud_firstname'] ?? '';
            $mid = $n['stud_middlename'] ?? '';
            $last = $n['stud_lastname'] ?? '';
            $n['student_name'] = trim("$first $mid $last");
        }
        $n['is_read'] = (bool)($n['is_read'] ?? 0);
        $n['read_status'] = $n['is_read'] ? 'read' : 'unread';
        $notifications[] = $n;
    }
    
    $total = count($notifications);
    $unread = count(array_filter($notifications, function($n){ return !$n['is_read']; }));
    $read = $total - $unread;
    
    echo json_encode([
        'status' => 'success',
        'notifications' => $notifications,
        'total_count' => $total,
        'unread_count' => $unread,
        'read_count' => $read
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error', 'error' => $e->getMessage()]);
}
?>
