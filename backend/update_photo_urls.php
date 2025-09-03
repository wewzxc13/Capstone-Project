<?php
// Simple script to update photo URLs in database
include_once 'connection.php';

try {
    echo "Starting photo URL update...\n";
    
    // Get all users with photo URLs
    $stmt = $conn->prepare("SELECT user_id, user_photo FROM tbl_users WHERE user_photo IS NOT NULL AND user_photo != ''");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updatedCount = 0;
    $errors = [];
    
    foreach ($users as $user) {
        $photoUrl = $user['user_photo'];
        $userId = $user['user_id'];
        
        echo "Processing user $userId: $photoUrl\n";
        
        // Extract filename from any full URL/path pointing to Uploads
        $filename = $photoUrl;
        if (preg_match('~^https?://~i', $photoUrl) || strpos($photoUrl, '/Uploads/') !== false) {
            $parts = explode('/', $photoUrl);
            $filename = end($parts);
            
            // Update the database with filename only
            $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
            if ($updateStmt->execute([$filename, $userId])) {
                $updatedCount++;
                echo "✅ Updated user $userId: $photoUrl -> $filename\n";
            } else {
                $errors[] = "Failed to update user $userId";
                echo "❌ Failed to update user $userId\n";
            }
        } else {
            echo "ℹ️ User $userId already has filename format: $photoUrl\n";
        }
    }
    
    echo "\n🎉 Migration completed!\n";
    echo "Updated records: $updatedCount\n";
    if (!empty($errors)) {
        echo "Errors: " . count($errors) . "\n";
        foreach ($errors as $error) {
            echo "- $error\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
}
?>
