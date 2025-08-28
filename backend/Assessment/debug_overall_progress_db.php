<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

echo "=== Overall Progress Notifications Database Debug ===\n\n";

// Check if there are any overall progress notifications
$query = "
    SELECT 
        n.notification_id,
        n.notif_message,
        n.created_by,
        n.created_at,
        nr.recipient_type,
        nr.user_id as recipient_user_id
    FROM tbl_notifications n
    INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
    WHERE (n.notif_message LIKE '%[OVERALL PROGRESS]%' OR n.notif_message LIKE '%overall progress%')
    ORDER BY n.created_at DESC
";

$stmt = $conn->prepare($query);
$stmt->execute();
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total overall progress notifications found: " . count($notifications) . "\n\n";

if (count($notifications) > 0) {
    echo "Notifications:\n";
    foreach ($notifications as $notif) {
        echo "- ID: " . $notif['notification_id'] . "\n";
        echo "  Message: " . $notif['notif_message'] . "\n";
        echo "  Created by: " . $notif['created_by'] . "\n";
        echo "  Created at: " . $notif['created_at'] . "\n";
        echo "  Recipient type: " . $notif['recipient_type'] . "\n";
        echo "  Recipient user ID: " . $notif['recipient_user_id'] . "\n\n";
    }
} else {
    echo "No overall progress notifications found in database.\n";
}

// Check all notifications for teacher ID 5
echo "=== All notifications for teacher ID 5 ===\n";
$query2 = "
    SELECT 
        n.notification_id,
        n.notif_message,
        n.created_by,
        n.created_at,
        nr.recipient_type,
        nr.user_id as recipient_user_id
    FROM tbl_notifications n
    INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
    WHERE nr.user_id = 5 AND nr.recipient_type = 'Teacher'
    ORDER BY n.created_at DESC
    LIMIT 10
";

$stmt2 = $conn->prepare($query2);
$stmt2->execute();
$teacherNotifications = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo "Total notifications for teacher ID 5: " . count($teacherNotifications) . "\n\n";

if (count($teacherNotifications) > 0) {
    echo "Teacher notifications:\n";
    foreach ($teacherNotifications as $notif) {
        echo "- ID: " . $notif['notification_id'] . "\n";
        echo "  Message: " . $notif['notif_message'] . "\n";
        echo "  Created by: " . $notif['created_by'] . "\n";
        echo "  Created at: " . $notif['created_at'] . "\n\n";
    }
}
?> 