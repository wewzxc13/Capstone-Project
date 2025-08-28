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
    
    $conn->beginTransaction();
    
    $totalMarkedAsRead = 0;
    $breakdown = [];
    
    // 1. Mark general meeting notifications as read (in tbl_notification_recipients)
    $stmt = $conn->prepare("
        UPDATE tbl_notification_recipients nr
        INNER JOIN tbl_notifications n ON n.notification_id = nr.notification_id
        INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
        SET nr.is_read = 1, nr.read_at = NOW()
        WHERE nr.user_id = ? 
        AND nr.recipient_type = 'Teacher'
        AND m.parent_id IS NULL 
        AND m.student_id IS NULL 
        AND m.advisory_id IS NULL
        AND nr.is_read = 0
    ");
    $stmt->execute([$userId]);
    $generalMeetingsMarked = $stmt->rowCount();
    $totalMarkedAsRead += $generalMeetingsMarked;
    $breakdown['general_meetings'] = $generalMeetingsMarked;
    
    // 2. Mark one-on-one meeting notifications as read (in tbl_meetings per-role flags)
    // For lead teacher
    $stmt = $conn->prepare("
        UPDATE tbl_meetings m
        INNER JOIN tbl_advisory a ON a.advisory_id = m.advisory_id
        SET m.lead_is_read = 1, m.lead_read_at = NOW()
        WHERE a.lead_teacher_id = ?
        AND (m.parent_id IS NOT NULL OR m.student_id IS NOT NULL OR m.advisory_id IS NOT NULL)
        AND m.lead_is_read = 0
    ");
    $stmt->execute([$userId]);
    $leadOneOnOneMarked = $stmt->rowCount();
    
    // For assistant teacher
    $stmt = $conn->prepare("
        UPDATE tbl_meetings m
        INNER JOIN tbl_advisory a ON a.advisory_id = m.advisory_id
        SET m.assistant_is_read = 1, m.assistant_read_at = NOW()
        WHERE a.assistant_teacher_id = ?
        AND (m.parent_id IS NOT NULL OR m.student_id IS NOT NULL OR m.advisory_id IS NOT NULL)
        AND m.assistant_is_read = 0
    ");
    $stmt->execute([$userId]);
    $assistantOneOnOneMarked = $stmt->rowCount();
    
    $oneOnOneMeetingsMarked = $leadOneOnOneMarked + $assistantOneOnOneMarked;
    $totalMarkedAsRead += $oneOnOneMeetingsMarked;
    $breakdown['one_on_one_meetings'] = $oneOnOneMeetingsMarked;
    
    // 3. Mark progress notifications as read (in tbl_progress_notification per-role flags)
    // For lead teacher
    $stmt = $conn->prepare("
        UPDATE tbl_progress_notification pn
        INNER JOIN tbl_students s ON s.student_id = pn.student_id
        INNER JOIN tbl_advisory a ON a.level_id = s.level_id
        SET pn.lead_is_read = 1, pn.lead_read_at = NOW()
        WHERE a.lead_teacher_id = ?
        AND pn.lead_is_read = 0
    ");
    $stmt->execute([$userId]);
    $leadProgressMarked = $stmt->rowCount();
    
    // For assistant teacher
    $stmt = $conn->prepare("
        UPDATE tbl_progress_notification pn
        INNER JOIN tbl_students s ON s.student_id = pn.student_id
        INNER JOIN tbl_advisory a ON a.level_id = s.level_id
        SET pn.assistant_is_read = 1, pn.assistant_read_at = NOW()
        WHERE a.assistant_teacher_id = ?
        AND pn.assistant_is_read = 0
    ");
    $stmt->execute([$userId]);
    $assistantProgressMarked = $stmt->rowCount();
    
    $progressMarked = $leadProgressMarked + $assistantProgressMarked;
    $totalMarkedAsRead += $progressMarked;
    $breakdown['progress_notifications'] = $progressMarked;
    
    // 4. Get current unread counts for summary
    $stmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM tbl_notifications n
             INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
             INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
             WHERE nr.user_id = ? 
             AND nr.recipient_type = 'Teacher'
             AND m.parent_id IS NULL 
             AND m.student_id IS NULL 
             AND m.advisory_id IS NULL
             AND nr.is_read = 0) as general_meetings,
            (SELECT COUNT(*) FROM tbl_notifications n
             INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
             INNER JOIN tbl_advisory a ON a.advisory_id = m.advisory_id
             WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
             AND (m.parent_id IS NOT NULL OR m.student_id IS NOT NULL OR m.advisory_id IS NOT NULL)
             AND (
                 (a.lead_teacher_id = ? AND m.lead_is_read = 0) OR
                 (a.assistant_teacher_id = ? AND m.assistant_is_read = 0)
             )) as one_on_one_meetings,
            (SELECT COUNT(*) FROM tbl_notifications n
             INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
             INNER JOIN tbl_students s ON pn.student_id = s.student_id
             INNER JOIN tbl_advisory a ON a.level_id = s.level_id
             WHERE (a.lead_teacher_id = ? OR a.assistant_teacher_id = ?)
             AND n.meeting_id IS NULL
             AND (
                 (a.lead_teacher_id = ? AND pn.lead_is_read = 0) OR
                 (a.assistant_teacher_id = ? AND pn.assistant_is_read = 0)
             )) as progress_notifications
    ");
    $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId]);
    $currentCounts = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $conn->commit();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'All notifications marked as read successfully',
        'summary' => [
            'marked_as_read' => $totalMarkedAsRead,
            'remaining_unread' => [
                'general_meetings' => (int)$currentCounts['general_meetings'],
                'one_on_one_meetings' => (int)$currentCounts['one_on_one_meetings'],
                'progress_notifications' => (int)$currentCounts['progress_notifications'],
                'total' => (int)$currentCounts['general_meetings'] + (int)$currentCounts['one_on_one_meetings'] + (int)$currentCounts['progress_notifications']
            ]
        ],
        'breakdown' => $breakdown
    ]);
    
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>
