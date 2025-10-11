<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../connection.php';

try {
    // Find and consolidate duplicate progress card notifications
    // Update the most recent notification's timestamp and remove older duplicates
    
    // First, find duplicate groups and update the most recent one's timestamp
    $update_query = "
        UPDATE tbl_notifications n1
        INNER JOIN (
            SELECT 
                created_by,
                notif_message,
                MAX(created_at) as max_created_at
            FROM tbl_notifications 
            WHERE notif_message LIKE '%[PROGRESS CARD]%'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY created_by, notif_message
            HAVING COUNT(*) > 1
        ) n2 ON n1.created_by = n2.created_by 
            AND n1.notif_message = n2.notif_message 
            AND n1.created_at = n2.max_created_at
        SET n1.created_at = NOW()
    ";
    
    $stmt = $conn->prepare($update_query);
    $stmt->execute();
    $updated_notifications = $stmt->rowCount();
    
    // Then remove older duplicates, keeping only the most recent one
    $cleanup_query = "
        DELETE n1 FROM tbl_notifications n1
        INNER JOIN tbl_notifications n2
        WHERE n1.notification_id < n2.notification_id
        AND n1.created_by = n2.created_by
        AND n1.notif_message = n2.notif_message
        AND n1.notif_message LIKE '%[PROGRESS CARD]%'
        AND n1.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ";
    
    $stmt2 = $conn->prepare($cleanup_query);
    $stmt2->execute();
    $deleted_notifications = $stmt2->rowCount();
    
    // Also clean up orphaned notification recipients
    $cleanup_recipients_query = "
        DELETE nr FROM tbl_notification_recipients nr
        LEFT JOIN tbl_notifications n ON nr.notification_id = n.notification_id
        WHERE n.notification_id IS NULL
    ";
    
    $stmt2 = $conn->prepare($cleanup_recipients_query);
    $stmt2->execute();
    $deleted_recipients = $stmt2->rowCount();
    
    echo json_encode([
        'status' => 'success',
        'message' => "Cleanup completed successfully",
        'updated_notifications' => $updated_notifications,
        'deleted_notifications' => $deleted_notifications,
        'deleted_recipients' => $deleted_recipients,
        'total_cleaned' => $deleted_notifications + $deleted_recipients
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn = null;
?> 