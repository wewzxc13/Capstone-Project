<?php
// Include CORS configuration
require_once '../Users/cors_config.php';

include_once '../connection.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'No input data']);
    exit;
}

// Required fields
$title = $data['meeting_title'] ?? null;
$agenda = $data['meeting_agenda'] ?? null;
$start = $data['meeting_start'] ?? null; // 'YYYY-MM-DD HH:MM:SS'
$end = $data['meeting_end'] ?? null;
$created_by = $data['created_by'] ?? null; // user_id of creator
$recipients = $data['recipients'] ?? []; // array of ['user_id'=>..., 'recipient_type'=>'Teacher'|'Parent']
$parent_id = $data['parent_id'] ?? null;
$student_id = $data['student_id'] ?? null;
$advisory_id = $data['advisory_id'] ?? null;

if (
    !$title || !$agenda || !$start || !$end || !$created_by ||
    (empty($recipients) && (!$parent_id || !$student_id))
) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

try {
    $conn->beginTransaction();

    // 1. Insert into tbl_meetings
    $stmt = $conn->prepare("
        INSERT INTO tbl_meetings (
            meeting_title, parent_id, student_id, advisory_id,
            meeting_start, meeting_end, meeting_agenda, meeting_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    ");
    $stmt->execute([
        $title,
        $parent_id,
        $student_id,
        $advisory_id,
        $start,
        $end,
        $agenda
    ]);
    $meeting_id = $conn->lastInsertId();

    // 2. Insert into tbl_notifications
    $notif_message = $data['notif_message'] ?? "[MEETING] Created the Meeting";
    $stmt = $conn->prepare("
        INSERT INTO tbl_notifications (
            notif_message, created_by, created_at, meeting_id
        ) VALUES (?, ?, NOW(), ?)
    ");
    $stmt->execute([
        $notif_message,
        $created_by,
        $meeting_id
    ]);
    $notification_id = $conn->lastInsertId();

    // 3. Insert into tbl_notification_recipients
    $stmt = $conn->prepare("
        INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type)
        VALUES (?, ?, ?)
    ");
    if (!empty($recipients)) {
        // Group meeting: insert all recipients
        foreach ($recipients as $r) {
            $stmt->execute([
                $notification_id,
                $r['user_id'],
                $r['recipient_type']
            ]);
        }
    } else if ($parent_id && $advisory_id) {
        // 1-on-1: insert parent and both co-advisors (lead and assistant teacher) as recipients
        // Insert parent
        $stmt->execute([
            $notification_id,
            $parent_id,
            'Parent'
        ]);
        // Fetch co-advisors from tbl_advisory
        $advisoryStmt = $conn->prepare("SELECT lead_teacher_id, assistant_teacher_id FROM tbl_advisory WHERE advisory_id = ?");
        $advisoryStmt->execute([$advisory_id]);
        $advisory = $advisoryStmt->fetch(PDO::FETCH_ASSOC);
        if ($advisory) {
            if (!empty($advisory['lead_teacher_id'])) {
                $stmt->execute([
                    $notification_id,
                    $advisory['lead_teacher_id'],
                    'Teacher'
                ]);
            }
            if (!empty($advisory['assistant_teacher_id']) && $advisory['assistant_teacher_id'] != $advisory['lead_teacher_id']) {
                $stmt->execute([
                    $notification_id,
                    $advisory['assistant_teacher_id'],
                    'Teacher'
                ]);
            }
        }
    }

    $conn->commit();

    echo json_encode([
        'status' => 'success',
        'meeting_id' => $meeting_id,
        'notification_id' => $notification_id
    ]);
} catch (PDOException $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(['message' => 'Database error', 'error' => $e->getMessage()]);
}
?> 