<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo "<h2>Debug Progress Card Notifications</h2>";

// Test the API directly
$test_data = [
    'user_id' => 5, // Teacher ID from the database
    'user_role' => 'Teacher'
];

echo "<h3>Testing API with Teacher Role</h3>";
echo "<p><strong>Request:</strong></p>";
echo "<pre>" . json_encode($test_data, JSON_PRETTY_PRINT) . "</pre>";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/capstone-project/backend/Assessment/get_progress_card_notifications.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p><strong>Response (HTTP {$http_code}):</strong></p>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

// Also test with Super Admin
$test_data_super = [
    'user_id' => 1,
    'user_role' => 'Super Admin'
];

echo "<h3>Testing API with Super Admin Role</h3>";
echo "<p><strong>Request:</strong></p>";
echo "<pre>" . json_encode($test_data_super, JSON_PRETTY_PRINT) . "</pre>";

$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, 'http://localhost/capstone-project/backend/Assessment/get_progress_card_notifications.php');
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($test_data_super));
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);

$response2 = curl_exec($ch2);
$http_code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "<p><strong>Response (HTTP {$http_code2}):</strong></p>";
echo "<pre>" . htmlspecialchars($response2) . "</pre>";

// Check database directly
echo "<h3>Direct Database Check</h3>";
require_once '../connection.php';

echo "<h4>All notifications with [PROGRESS CARD]:</h4>";
$query = "SELECT * FROM tbl_notifications WHERE notif_message LIKE '%[PROGRESS CARD]%' ORDER BY created_at DESC";
$stmt = $conn->prepare($query);
$stmt->execute();
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<p><strong>Found " . count($notifications) . " progress card notifications:</strong></p>";
foreach ($notifications as $notif) {
    echo "<div style='border: 1px solid #ccc; margin: 5px; padding: 10px;'>";
    echo "<strong>ID:</strong> " . $notif['notification_id'] . "<br>";
    echo "<strong>Message:</strong> " . htmlspecialchars($notif['notif_message']) . "<br>";
    echo "<strong>Created by:</strong> " . $notif['created_by'] . "<br>";
    echo "<strong>Created at:</strong> " . $notif['created_at'] . "<br>";
    echo "</div>";
}

echo "<h4>All notification recipients for progress card notifications:</h4>";
$query2 = "SELECT nr.*, n.notif_message 
           FROM tbl_notification_recipients nr 
           INNER JOIN tbl_notifications n ON nr.notification_id = n.notification_id 
           WHERE n.notif_message LIKE '%[PROGRESS CARD]%' 
           ORDER BY n.created_at DESC";
$stmt2 = $conn->prepare($query2);
$stmt2->execute();
$recipients = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo "<p><strong>Found " . count($recipients) . " recipients:</strong></p>";
foreach ($recipients as $recip) {
    echo "<div style='border: 1px solid #ccc; margin: 5px; padding: 10px;'>";
    echo "<strong>Recipient ID:</strong> " . $recip['recipient_id'] . "<br>";
    echo "<strong>Notification ID:</strong> " . $recip['notification_id'] . "<br>";
    echo "<strong>User ID:</strong> " . $recip['user_id'] . "<br>";
    echo "<strong>Recipient Type:</strong> " . $recip['recipient_type'] . "<br>";
    echo "<strong>Message:</strong> " . htmlspecialchars($recip['notif_message']) . "<br>";
    echo "</div>";
}

$conn->close();
?> 