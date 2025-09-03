<?php
// Fix specific user photo URL
include_once 'connection.php';

try {
    echo "Fixing user photo URL...\n";
    
    // Find the specific user
    $stmt = $conn->prepare("SELECT user_id, user_photo FROM tbl_users WHERE user_email = ?");
    $stmt->execute(['clarsejay@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        $photoUrl = $user['user_photo'];
        $userId = $user['user_id'];
        
        echo "Found user $userId with photo: $photoUrl\n";
        
        // Extract filename from any full URL/path pointing to Uploads
        $filename = $photoUrl;
        if (preg_match('~^https?://~i', $photoUrl) || strpos($photoUrl, '/Uploads/') !== false) {
            $parts = explode('/', $photoUrl);
            $filename = end($parts);
            
            // Update the database with filename only
            $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
            if ($updateStmt->execute([$filename, $userId])) {
                echo "✅ Fixed user $userId: $photoUrl -> $filename\n";
            } else {
                echo "❌ Failed to update user $userId\n";
            }
        } else {
            echo "ℹ️ User $userId already has correct format: $photoUrl\n";
        }
    } else {
        echo "❌ User not found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Fix failed: " . $e->getMessage() . "\n";
}
?>
