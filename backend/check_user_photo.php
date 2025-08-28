<?php
// Check current user photo in database
include_once 'connection.php';

try {
    echo "Checking current user photo in database...\n";
    
    // Find the specific user
    $stmt = $conn->prepare("SELECT user_id, user_email, user_photo FROM tbl_users WHERE user_email = ?");
    $stmt->execute(['clarsejay@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "User ID: " . $user['user_id'] . "\n";
        echo "Email: " . $user['user_email'] . "\n";
        echo "Photo field: '" . $user['user_photo'] . "'\n";
        echo "Photo field length: " . strlen($user['user_photo']) . "\n";
        
        if (strpos($user['user_photo'], 'http://localhost/capstone-project/backend/Uploads/') === 0) {
            echo "❌ Still contains full URL\n";
        } else {
            echo "✅ Contains filename only\n";
        }
    } else {
        echo "❌ User not found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Check failed: " . $e->getMessage() . "\n";
}
?>
