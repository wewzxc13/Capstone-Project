<?php
// Quick fix for the DSC02412 photo filename mismatch
include_once '../connection.php';

try {
    echo "=== FIXING DSC02412 PHOTO FILENAME MISMATCH ===\n\n";
    
    // Find users with the incorrect DSC02412 filename
    $stmt = $conn->prepare("SELECT user_id, user_firstname, user_lastname, user_photo FROM tbl_users WHERE user_photo LIKE '%DSC02412%'");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "No users found with DSC02412 photos in database.\n";
        exit;
    }
    
    echo "Found " . count($users) . " user(s) with DSC02412 photos:\n\n";
    
    foreach ($users as $user) {
        $userId = $user['user_id'];
        $userName = $user['user_firstname'] . ' ' . $user['user_lastname'];
        $currentPhoto = $user['user_photo'];
        
        echo "User ID: $userId ($userName)\n";
        echo "Current photo: $currentPhoto\n";
        
        // The correct filename based on your uploads folder
        $correctFilename = 'img_2arsk_DSC02412.jpg';
        
        if ($currentPhoto !== $correctFilename) {
            echo "🔧 Fixing filename mismatch...\n";
            
            // Update to the correct filename
            $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
            if ($updateStmt->execute([$correctFilename, $userId])) {
                echo "✅ FIXED: Updated from '$currentPhoto' to '$correctFilename'\n";
            } else {
                echo "❌ FAILED to update user $userId\n";
            }
        } else {
            echo "✅ Already correct: $currentPhoto\n";
        }
        
        echo "---\n";
    }
    
    echo "\n🎉 DSC02412 photo fix completed!\n";
    echo "The photo should now load correctly at: https://learnersville.online/backend-ville/Uploads/img_2arsk_DSC02412.jpg\n";
    
} catch (Exception $e) {
    echo "❌ Fix failed: " . $e->getMessage() . "\n";
}
?>
