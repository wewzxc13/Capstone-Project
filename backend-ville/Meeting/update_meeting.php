<?php
// Prevent any HTML output that could corrupt JSON
error_reporting(E_ERROR | E_PARSE); // Only show critical errors
ini_set('display_errors', 0); // Don't display errors in output
ob_start(); // Start output buffering to catch any unexpected output

// Include CORS configuration
require_once '../Users/cors_config.php';

header("Content-Type: application/json"); // Ensure JSON content type

include_once '../connection.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No input data']);
    exit;
}

$meeting_id = $data['meeting_id'] ?? null;
$title = $data['meeting_title'] ?? null;
$agenda = $data['meeting_agenda'] ?? null;
$start = $data['meeting_start'] ?? null;
$end = $data['meeting_end'] ?? null;
$created_by = $data['created_by'] ?? null;
$recipients = $data['recipients'] ?? [];
$force_status = $data['meeting_status'] ?? null;
$parent_id = $data['parent_id'] ?? null;
$student_id = $data['student_id'] ?? null;
$advisory_id = $data['advisory_id'] ?? null;

if (!$meeting_id) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing meeting_id']);
    exit;
}

try {
    $conn->beginTransaction();

    // If force_status is 'Cancelled', just update status and exit
    if ($force_status === 'Cancelled') {
        // Require created_by for cancellation
        if (!$created_by) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing created_by (user id) for cancellation']);
            exit;
        }
        // Update meeting status to cancelled
        $stmt = $conn->prepare("UPDATE tbl_meetings SET meeting_status = 'Cancelled' WHERE meeting_id = ?");
        $stmt->execute([$meeting_id]);
        
        // Update the existing notification message instead of creating new one
        $notif_message = $data['notif_message'] ?? "[MEETING] Cancelled the meeting";
        
        // Get the existing notification for this meeting
        $stmt = $conn->prepare("SELECT notification_id FROM tbl_notifications WHERE meeting_id = ? ORDER BY created_at DESC, notification_id DESC LIMIT 1");
        $stmt->execute([$meeting_id]);
        $notif = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($notif) {
            // Update the existing notification message and created_by (who performed the cancellation)
            $stmt = $conn->prepare("UPDATE tbl_notifications SET notif_message = ?, created_by = ?, created_at = NOW() WHERE notification_id = ?");
            $stmt->execute([$notif_message, $created_by, $notif['notification_id']]);
        } else {
            // Fallback: create new notification if none exists (shouldn't happen normally)
            $stmt = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at, meeting_id) VALUES (?, ?, NOW(), ?)");
            $stmt->execute([$notif_message, $created_by, $meeting_id]);
        }
        $conn->commit();
        ob_clean();
        echo json_encode(['status' => 'success', 'message' => 'Meeting cancelled successfully']);
        exit;
    }

    // Only require other fields if not cancelling
    if (
        !$title || !$agenda || !$start || !$end || !$created_by ||
        (empty($recipients) && (!$parent_id || !$student_id))
    ) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    // 1. Get current meeting details
    $stmt = $conn->prepare("SELECT meeting_start, meeting_end, meeting_status FROM tbl_meetings WHERE meeting_id = ?");
    $stmt->execute([$meeting_id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$current) {
        throw new Exception('Meeting not found');
    }
    $old_start = $current['meeting_start'];
    $old_end = $current['meeting_end'];
    $current_status = $current['meeting_status'];

    // 2. Determine what changed and set appropriate status
    // Normalize dates to YYYY-MM-DD HH:MM:SS format for accurate comparison
    $normalized_old_start = date('Y-m-d H:i:s', strtotime($old_start));
    $normalized_new_start = date('Y-m-d H:i:s', strtotime($start));
    $normalized_old_end = date('Y-m-d H:i:s', strtotime($old_end));
    $normalized_new_end = date('Y-m-d H:i:s', strtotime($end));
    
    $dateTimeChanged = ($normalized_old_start !== $normalized_new_start || $normalized_old_end !== $normalized_new_end);
    

    
    // For one-on-one meetings (has parent_id, student_id)
    if ($parent_id && $student_id) {
        // Get current invitee details to check if they changed
        $stmt = $conn->prepare("SELECT parent_id, student_id, meeting_title, meeting_agenda FROM tbl_meetings WHERE meeting_id = ?");
        $stmt->execute([$meeting_id]);
        $currentMeeting = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $inviteesChanged = ($currentMeeting['parent_id'] != $parent_id || $currentMeeting['student_id'] != $student_id);
        $titleChanged = ($currentMeeting['meeting_title'] !== $title);
        $agendaChanged = ($currentMeeting['meeting_agenda'] !== $agenda);
        $otherFieldsChanged = ($titleChanged || $agendaChanged || $inviteesChanged);
        
        if ($dateTimeChanged && $otherFieldsChanged) {
            $status = 'Rescheduled'; // Both date/time and other fields changed
        } else if ($dateTimeChanged) {
            $status = 'Rescheduled'; // Only date/time changed
        } else if ($otherFieldsChanged) {
            $status = 'Scheduled'; // Only other fields (title, agenda, invitees) changed
        } else {
            $status = $current_status; // No significant changes, keep current status
        }
    } else {
        // For group meetings (NULL parent_id, student_id, advisory_id) - keep existing logic
        if ($current_status === 'Rescheduled') {
            $status = 'Rescheduled'; // Keep as Rescheduled
        } else {
            $status = ($old_start !== $start || $old_end !== $end) ? 'Rescheduled' : 'Scheduled';
        }
    }

    // 3. Update tbl_meetings

    
    if ($parent_id && $student_id) {
        // For one-on-one meetings: update all fields including parent_id, student_id, keep advisory_id
        $stmt = $conn->prepare("
            UPDATE tbl_meetings SET meeting_title=?, meeting_agenda=?, meeting_start=?, meeting_end=?, meeting_status=?, parent_id=?, student_id=? WHERE meeting_id=?
        ");
        $stmt->execute([
            $title,
            $agenda,
            $start,
            $end,
            $status,
            $parent_id,
            $student_id,
            $meeting_id
        ]);
    } else {
        // For group meetings (admin created): only update basic fields, don't touch parent_id/student_id/advisory_id
        $stmt = $conn->prepare("
            UPDATE tbl_meetings SET meeting_title=?, meeting_agenda=?, meeting_start=?, meeting_end=?, meeting_status=? WHERE meeting_id=?
        ");
        $stmt->execute([
            $title,
            $agenda,
            $start,
            $end,
            $status,
            $meeting_id
        ]);
    }

    // 4. Update notification message for existing notification
    // Get the latest notification for this meeting
    $stmt = $conn->prepare("SELECT notification_id FROM tbl_notifications WHERE meeting_id = ? ORDER BY created_at DESC, notification_id DESC LIMIT 1");
    $stmt->execute([$meeting_id]);
    $notif = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($notif) {
        $notification_id = $notif['notification_id'];
        
        // Update the existing notification message
        $notif_message = $data['notif_message'] ?? "[MEETING] Updated the meeting";
        $stmt = $conn->prepare("UPDATE tbl_notifications SET notif_message = ?, created_at = NOW() WHERE notification_id = ?");
        $stmt->execute([$notif_message, $notification_id]);
        
        // 5. Get current recipients to compare with new recipients
        $stmt = $conn->prepare("SELECT user_id, recipient_type FROM tbl_notification_recipients WHERE notification_id = ?");
        $stmt->execute([$notification_id]);
        $current_recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create arrays for comparison
        $current_recipients_set = array();
        foreach ($current_recipients as $cr) {
            $current_recipients_set[] = $cr['user_id'] . '_' . $cr['recipient_type'];
        }
        
        $new_recipients_set = array();
        foreach ($recipients as $nr) {
            $new_recipients_set[] = $nr['user_id'] . '_' . $nr['recipient_type'];
        }
        
        // Find recipients to remove (in current but not in new)
        $recipients_to_remove = array();
        foreach ($current_recipients as $cr) {
            $key = $cr['user_id'] . '_' . $cr['recipient_type'];
            if (!in_array($key, $new_recipients_set)) {
                $recipients_to_remove[] = $cr;
            }
        }
        
        // Find recipients to add (in new but not in current)
        $recipients_to_add = array();
        foreach ($recipients as $nr) {
            $key = $nr['user_id'] . '_' . $nr['recipient_type'];
            if (!in_array($key, $current_recipients_set)) {
                $recipients_to_add[] = $nr;
            }
        }
        
        // Remove old recipients that are no longer invited
        if (!empty($recipients_to_remove)) {
            $stmt = $conn->prepare("DELETE FROM tbl_notification_recipients WHERE notification_id = ? AND user_id = ? AND recipient_type = ?");
            foreach ($recipients_to_remove as $r) {
                $stmt->execute([$notification_id, $r['user_id'], $r['recipient_type']]);
            }
        }
        
        // Add new recipients
        if (!empty($recipients_to_add)) {
            $stmt = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, ?)");
            foreach ($recipients_to_add as $r) {
                $stmt->execute([$notification_id, $r['user_id'], $r['recipient_type']]);
            }
        }
        
    } else {
        // Fallback: create new notification if none exists (shouldn't happen normally)
        $notif_message = $data['notif_message'] ?? "[MEETING] Updated the meeting";
        $stmt = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at, meeting_id) VALUES (?, ?, NOW(), ?)");
        $stmt->execute([$notif_message, $created_by, $meeting_id]);
        $notification_id = $conn->lastInsertId();
        
        // Insert all recipients for new notification
        $stmt = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type) VALUES (?, ?, ?)");
        foreach ($recipients as $r) {
            $stmt->execute([$notification_id, $r['user_id'], $r['recipient_type']]);
        }
    }

    $conn->commit();
    
    // Fetch the updated meeting data to return to frontend
    $stmt = $conn->prepare("
        SELECT 
            meeting_id as id,
            meeting_title as title,
            meeting_agenda as agenda,
            meeting_start,
            meeting_end,
            meeting_status as status
        FROM tbl_meetings 
        WHERE meeting_id = ?
    ");
    $stmt->execute([$meeting_id]);
    $updated_meeting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Format the meeting data for frontend
    if ($updated_meeting) {
        $start_date = new DateTime($updated_meeting['meeting_start']);
        $end_date = new DateTime($updated_meeting['meeting_end']);
        
        $updated_meeting['year'] = (int)$start_date->format('Y');
        $updated_meeting['month'] = $start_date->format('F');
        $updated_meeting['day'] = (int)$start_date->format('j');
        $updated_meeting['time'] = $start_date->format('H:i') . ' - ' . $end_date->format('H:i');
    }
    
    // Clean any unexpected output before sending JSON
    ob_clean();
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Meeting updated successfully', 
        'rescheduled' => !!$status,
        'updated_meeting' => $updated_meeting
    ]);
} catch (Exception $e) {
    // Only rollback if transaction is still active
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    
    // Clean any unexpected output before sending JSON
    ob_clean();
    
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?> 