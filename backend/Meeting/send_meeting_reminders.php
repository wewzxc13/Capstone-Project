<?php
// Purpose: Generate 48-hour reminder notifications for upcoming meetings.
// Strategy:
// - Find meetings whose start time is ~48 hours from now (47-48h window)
// - Skip meetings already reminded (notif_message starts with "[REMINDER]")
// - Copy recipients from the original meeting notification; if none, derive from 1-on-1 fields
// - Insert one notification per meeting with notif_message formatted for frontend

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

try {
    // Optional: allow GET or POST to trigger this script
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        exit;
    }

    // Window: meetings starting approximately 48 hours from now
    // Using 47-48 hours to fit hourly scheduler without duplicates
    $sql = "
        SELECT 
            m.meeting_id,
            m.meeting_title,
            m.meeting_start,
            m.meeting_end,
            m.meeting_status,
            m.parent_id,
            m.student_id,
            m.advisory_id,
            (
                SELECT n0.created_by 
                FROM tbl_notifications n0 
                WHERE n0.meeting_id = m.meeting_id 
                ORDER BY n0.created_at ASC, n0.notification_id ASC 
                LIMIT 1
            ) AS creator_id
        FROM tbl_meetings m
        WHERE m.meeting_status IN ('Scheduled','Rescheduled')
          AND TIMESTAMPDIFF(HOUR, NOW(), m.meeting_start) BETWEEN 47 AND 48
          AND NOT EXISTS (
                SELECT 1 
                FROM tbl_notifications n1 
                WHERE n1.meeting_id = m.meeting_id 
                  AND n1.notif_message LIKE '[REMINDER]%'
          )
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($meetings)) {
        echo json_encode(['status' => 'success', 'processed' => 0, 'details' => []]);
        exit;
    }

    $processed = 0;
    $details = [];

    // Prepare insert statements
    $insertNotifStmt = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at, meeting_id) VALUES (?, ?, NOW(), ?)");
    $insertRecipStmt = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, ?)");

    foreach ($meetings as $m) {
        $conn->beginTransaction();
        try {
            $meetingId = $m['meeting_id'];

            // 1) Collect recipients from existing notifications for this meeting
            $recipients = [];
            $recipStmt = $conn->prepare("SELECT DISTINCT nr.user_id, nr.recipient_type
                                          FROM tbl_notification_recipients nr
                                          WHERE nr.notification_id IN (
                                              SELECT n.notification_id FROM tbl_notifications n WHERE n.meeting_id = ?
                                          )");
            $recipStmt->execute([$meetingId]);
            $recipients = $recipStmt->fetchAll(PDO::FETCH_ASSOC);

            // 1-on-1 fallback (parent + co-advisors) when recipients are empty
            if (empty($recipients) && !empty($m['parent_id']) && !empty($m['advisory_id'])) {
                $recipients[] = [ 'user_id' => $m['parent_id'], 'recipient_type' => 'Parent' ];
                $advStmt = $conn->prepare("SELECT lead_teacher_id, assistant_teacher_id FROM tbl_advisory WHERE advisory_id = ?");
                $advStmt->execute([$m['advisory_id']]);
                if ($adv = $advStmt->fetch(PDO::FETCH_ASSOC)) {
                    if (!empty($adv['lead_teacher_id'])) {
                        $recipients[] = [ 'user_id' => $adv['lead_teacher_id'], 'recipient_type' => 'Teacher' ];
                    }
                    if (!empty($adv['assistant_teacher_id']) && $adv['assistant_teacher_id'] != $adv['lead_teacher_id']) {
                        $recipients[] = [ 'user_id' => $adv['assistant_teacher_id'], 'recipient_type' => 'Teacher' ];
                    }
                }
            }

            // 2) Build reminder message
            $start = new DateTime($m['meeting_start']);
            $end = new DateTime($m['meeting_end']);
            $dateStr = $start->format('F j');
            $timeStr = $start->format('g:i A') . ' to ' . $end->format('g:i A');
            $title = $m['meeting_title'];
            $message = "[REMINDER] Upcoming meeting '" . $title . "' on " . $dateStr . ", from " . $timeStr . ".";

            // 3) Insert reminder notification
            $creatorId = $m['creator_id'] ?? 0; // 0 == system
            $insertNotifStmt->execute([$message, $creatorId, $meetingId]);
            $notificationId = $conn->lastInsertId();

            // 4) Insert recipients (if any). If none, it's still fine; admins will still see it in admin views
            foreach ($recipients as $r) {
                if (!empty($r['user_id']) && !empty($r['recipient_type'])) {
                    $insertRecipStmt->execute([$notificationId, $r['user_id'], $r['recipient_type']]);
                }
            }

            $conn->commit();
            $processed++;
            $details[] = [
                'meeting_id' => (int)$meetingId,
                'notification_id' => (int)$notificationId,
                'recipient_count' => count($recipients)
            ];
        } catch (Throwable $txe) {
            $conn->rollBack();
            // Continue with others, but record the failure
            $details[] = [
                'meeting_id' => (int)$m['meeting_id'],
                'error' => $txe->getMessage()
            ];
        }
    }

    echo json_encode([
        'status' => 'success',
        'processed' => $processed,
        'details' => $details
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>


