<?php
// Comprehensive script to fix photo filename mismatches
include_once '../connection.php';

try {
    echo "=== COMPREHENSIVE PHOTO MISMATCH FIX ===\n\n";
    
    // Get all users with DSC02412 photos
    $stmt = $conn->prepare("SELECT user_id, user_firstname, user_middlename, user_lastname, user_email, user_photo FROM tbl_users WHERE user_photo LIKE '%DSC02412%'");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($users)) {
        echo "No users found with DSC02412 photos.\n";
        exit;
    }
    
    echo "Found " . count($users) . " user(s) with DSC02412 photos:\n\n";
    
    // The correct filename that actually exists
    $correctFilename = 'img_2arsk_DSC02412.jpg';
    $uploadsPath = '../Uploads/';
    
    foreach ($users as $user) {
        $userId = $user['user_id'];
        $userName = $user['user_firstname'] . ' ' . $user['user_middlename'] . ' ' . $user['user_lastname'];
        $userEmail = $user['user_email'];
        $currentPhoto = $user['user_photo'];
        
        echo "User: $userName (ID: $userId)\n";
        echo "Email: $userEmail\n";
        echo "Current photo: $currentPhoto\n";
        
        // Check if the current photo file exists
        $currentPhotoPath = $uploadsPath . $currentPhoto;
        $currentPhotoExists = file_exists($currentPhotoPath);
        
        // Check if the correct photo file exists
        $correctPhotoPath = $uploadsPath . $correctFilename;
        $correctPhotoExists = file_exists($correctPhotoPath);
        
        echo "Current photo exists: " . ($currentPhotoExists ? "YES" : "NO") . "\n";
        echo "Correct photo exists: " . ($correctPhotoExists ? "YES" : "NO") . "\n";
        
        if (!$currentPhotoExists && $correctPhotoExists && $currentPhoto !== $correctFilename) {
            echo "🔧 FIXING: Current photo doesn't exist, but correct one does.\n";
            echo "   Updating from '$currentPhoto' to '$correctFilename'\n";
            
            // Update to the correct filename
            $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
            if ($updateStmt->execute([$correctFilename, $userId])) {
                echo "✅ SUCCESS! Database updated.\n";
                echo "   Photo URL: https://learnersville.online/backend-ville/Uploads/$correctFilename\n";
            } else {
                echo "❌ FAILED to update database.\n";
            }
        } elseif ($currentPhotoExists) {
            echo "✅ Current photo file exists - no fix needed.\n";
        } elseif (!$correctPhotoExists) {
            echo "⚠️  Neither current nor correct photo files exist!\n";
            echo "   Setting to default parent photo.\n";
            
            $defaultPhoto = 'default_parent.png';
            $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
            if ($updateStmt->execute([$defaultPhoto, $userId])) {
                echo "✅ Set to default parent photo: $defaultPhoto\n";
            } else {
                echo "❌ Failed to set default photo.\n";
            }
        }
        
        echo "---\n";
    }
    
    echo "\n🎉 Photo mismatch fix completed!\n";
    echo "Please refresh the Parent Details page to see the changes.\n";
    
} catch (Exception $e) {
    echo "❌ Fix failed: " . $e->getMessage() . "\n";
}
?>
