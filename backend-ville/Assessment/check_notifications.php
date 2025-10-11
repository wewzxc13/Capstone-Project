<?php
require_once 'connection.php';

echo "Checking notifications...\n";

try {
    // Get the specific notification from the image
    $stmt = $conn->prepare("SELECT notification_id, notif_message, created_by, created_at FROM tbl_notifications WHERE notif_message LIKE '%Richard Montizor Gamon%' AND notif_message LIKE '%OVERALL PROGRESS%' ORDER BY created_at DESC LIMIT 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "Found notification:\n";
        echo "ID: " . $result['notification_id'] . "\n";
        echo "Message: " . $result['notif_message'] . "\n";
        echo "Created by: " . $result['created_by'] . "\n";
        echo "Created at: " . $result['created_at'] . "\n";
        
        // Test the conversion logic
        $message = $result['notif_message'];
        $created_by = $result['created_by'];
        $user_id = '5'; // Jessa Decena's user ID
        $user_role = 'Teacher';
        
        echo "\nTesting conversion:\n";
        echo "User ID: $user_id\n";
        echo "Created by: $created_by\n";
        echo "Match: " . ($user_id == $created_by ? 'YES' : 'NO') . "\n";
        
        if ($user_role === 'Teacher' && $created_by == $user_id) {
            echo "Condition is TRUE - should convert\n";
            
            if (preg_match('/Overall progress for (.+?) has been updated by (.+?)\./', $message, $matches)) {
                $studentName = $matches[1];
                $converted = "[OVERALL PROGRESS] You updated the overall progress for $studentName.";
                echo "Converted to: $converted\n";
            } else {
                echo "Pattern didn't match\n";
            }
        } else {
            echo "Condition is FALSE - keeping original\n";
        }
    } else {
        echo "No notification found\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 