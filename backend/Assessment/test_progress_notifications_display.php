<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

echo "Testing Progress Card Notifications API...\n\n";

// Test with Teacher role
$testData = [
    'user_id' => '5', // Assuming this is a teacher ID
    'user_role' => 'Teacher'
];

echo "Testing with data: " . json_encode($testData) . "\n\n";

try {
    // Test progress card notifications
    $stmt = $conn->prepare("
        SELECT DISTINCT n.notification_id, n.notif_message, n.created_by, n.created_at,
               nr.user_id as recipient_user_id, nr.recipient_type, pn.student_id,
               s.stud_firstname, s.stud_middlename, s.stud_lastname,
               q.quarter_name,
               pn.quarter_id
        FROM tbl_notifications n
        INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        LEFT JOIN tbl_students s ON pn.student_id = s.student_id
        LEFT JOIN tbl_quarters q ON pn.quarter_id = q.quarter_id
        WHERE nr.user_id = ? 
        AND nr.recipient_type = 'Teacher'
        AND n.notif_message LIKE '%[QUARTERLY PROGRESS]%'
        AND pn.quarter_id IS NOT NULL
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    $stmt->execute([$testData['user_id']]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Progress Card Notifications Found: " . count($results) . "\n";
    foreach ($results as $row) {
        echo "- ID: {$row['notification_id']}, Message: {$row['notif_message']}, Created: {$row['created_at']}\n";
    }
    
    echo "\nTesting Overall Progress Notifications API...\n\n";
    
    // Test overall progress notifications
    $stmt2 = $conn->prepare("
        SELECT DISTINCT n.notification_id, n.notif_message, n.created_by, n.created_at,
               nr.user_id as recipient_user_id, nr.recipient_type, pn.student_id,
               s.stud_firstname, s.stud_middlename, s.stud_lastname
        FROM tbl_notifications n
        INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
        INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        LEFT JOIN tbl_students s ON pn.student_id = s.student_id
        WHERE nr.user_id = ? 
        AND nr.recipient_type = 'Teacher'
        AND n.notif_message LIKE '%[OVERALL PROGRESS]%'
        AND pn.quarter_id IS NULL
        ORDER BY n.created_at DESC
        LIMIT 50
    ");
    $stmt2->execute([$testData['user_id']]);
    $results2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Overall Progress Notifications Found: " . count($results2) . "\n";
    foreach ($results2 as $row) {
        echo "- ID: {$row['notification_id']}, Message: {$row['notif_message']}, Created: {$row['created_at']}\n";
    }
    
    echo "\nTotal notifications for user {$testData['user_id']}: " . (count($results) + count($results2)) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 