<?php
require_once '../connection.php';
header('Content-Type: application/json');

// Clear old progress card notifications (old format)
$stmt1 = $conn->prepare("DELETE FROM tbl_notification_recipients WHERE notification_id IN (SELECT notification_id FROM tbl_notifications WHERE notif_message LIKE '%[PROGRESS CARD]%')");
$stmt1->execute();

$stmt2 = $conn->prepare("DELETE FROM tbl_notifications WHERE notif_message LIKE '%[PROGRESS CARD]%'");
$stmt2->execute();

// Clear old overall progress notifications (old format with "by Teacher")
$stmt3 = $conn->prepare("DELETE FROM tbl_notification_recipients WHERE notification_id IN (SELECT notification_id FROM tbl_notifications WHERE notif_message LIKE '%[OVERALL PROGRESS]%' AND notif_message LIKE '%by %')");
$stmt3->execute();

$stmt4 = $conn->prepare("DELETE FROM tbl_notifications WHERE notif_message LIKE '%[OVERALL PROGRESS]%' AND notif_message LIKE '%by %'");
$stmt4->execute();

echo json_encode([
    "status" => "success",
    "message" => "Old notifications cleared. New notifications will use the correct format."
]);
?> 