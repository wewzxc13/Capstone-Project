<?php
// Include CORS configuration
require_once '../Users/cors_config.php';

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Only GET requests are allowed']);
    exit;
}

try {
    // Get upcoming meetings with status 'Scheduled' or 'Rescheduled'
    $stmt = $conn->prepare("
        SELECT 
            m.meeting_id,
            m.meeting_title,
            m.meeting_start,
            m.meeting_end,
            m.meeting_agenda,
            m.meeting_status,
            m.parent_id,
            m.student_id,
            m.advisory_id,
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
        WHERE m.meeting_status IN ('Scheduled', 'Rescheduled')
        AND m.meeting_start > NOW()
        ORDER BY m.meeting_start DESC
    ");
    
    $stmt->execute();
    $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the meetings for display
    $formattedMeetings = [];
    foreach ($meetings as $meeting) {
        $startDate = new DateTime($meeting['meeting_start']);
        $endDate = new DateTime($meeting['meeting_end']);
        
        $formattedMeetings[] = [
            'id' => $meeting['meeting_id'],
            'title' => $meeting['meeting_title'],
            'date' => $startDate->format('F j, Y'),
            'time' => $startDate->format('g:i A') . ' - ' . $endDate->format('g:i A'),
            'agenda' => $meeting['meeting_agenda'],
            'status' => $meeting['meeting_status'],
            'parent_id' => $meeting['parent_id'],
            'student_id' => $meeting['student_id'],
            'advisory_id' => $meeting['advisory_id'],
            // Pass through the creator id from tbl_notifications so the UI can highlight "You"
            'created_by' => $meeting['created_by'],
            'color' => $meeting['meeting_status'] === 'Scheduled' ? 'border-l-4 border-green-400' : 'border-l-4 border-blue-400'
        ];
    }

    echo json_encode([
        'status' => 'success',
        'meetings' => $formattedMeetings
    ]);

} catch (PDOException $e) {
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_upcoming_meetings.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 