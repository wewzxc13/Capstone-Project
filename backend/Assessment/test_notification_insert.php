<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

try {
    // Test manual notification insertion
    $conn->beginTransaction();
    
    // 1. Insert into tbl_notifications
    $notificationMessage = "[QUARTERLY PROGRESS] Finalized a Quarterly Progress";
    $teacherId = 1; // Test teacher ID
    
    $stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
    $stmtNotif->execute([$notificationMessage, $teacherId]);
    $notification_id = $conn->lastInsertId();
    
    echo "Notification ID: $notification_id\n";
    
    // 2. Insert into tbl_notification_recipients (Teacher)
    $studentId = 1; // Test student ID
    $stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Teacher', ?)");
    $stmtRecipient->execute([$notification_id, $teacherId, $studentId]);
    
    echo "Teacher recipient inserted\n";
    
    // 3. Insert into tbl_progress_notification
    $quarterId = 1; // Test quarter ID
    $stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, ?, ?)");
    $stmtProgressNotif->execute([$notification_id, $quarterId, $studentId]);
    
    echo "Progress notification inserted\n";
    
    $conn->commit();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Test notification inserted successfully',
        'notification_id' => $notification_id
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?> 