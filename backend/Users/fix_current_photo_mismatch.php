<?php
// Fix the current photo mismatch for Margareths
include_once '../connection.php';

try {
    echo "=== FIXING CURRENT PHOTO MISMATCH ===\n\n";
    
    // Find Margareths' record
    $stmt = $conn->prepare("SELECT user_id, user_firstname, user_middlename, user_lastname, user_email, user_photo FROM tbl_users WHERE user_email = 'manongdomargareth1335@gmail.com'");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "❌ User not found with email: manongdomargareth1335@gmail.com\n";
        exit;
    }
    
    $userId = $user['user_id'];
    $userName = $user['user_firstname'] . ' ' . $user['user_middlename'] . ' ' . $user['user_lastname'];
    $currentPhoto = $user['user_photo'];
    
    echo "Found user: $userName (ID: $userId)\n";
    echo "Current photo in database: $currentPhoto\n";
    
    // The actual file that exists on the server (from your file manager screenshot)
    $actualFile = 'img_2arsk_DSC02412.jpg';
    
    echo "Actual file on server: $actualFile\n";
    
    // Check if the actual file exists
    $uploadsPath = '../Uploads/';
    $actualFilePath = $uploadsPath . $actualFile;
    
    if (file_exists($actualFilePath)) {
        echo "✅ Confirmed: $actualFile exists on server\n";
        
        if ($currentPhoto !== $actualFile) {
            echo "🔧 Fixing database entry...\n";
            echo "   From: $currentPhoto\n";
            echo "   To:   $actualFile\n";
            
            // Update database to match the actual file
            $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
            if ($updateStmt->execute([$actualFile, $userId])) {
                echo "✅ SUCCESS! Database updated to match actual file.\n";
                echo "   Photo URL: https://learnersville.online/backend-ville/Uploads/$actualFile\n";
            } else {
                echo "❌ FAILED to update database.\n";
            }
        } else {
            echo "✅ Database already matches actual file.\n";
        }
    } else {
        echo "❌ ERROR: $actualFile does not exist on server!\n";
        echo "   Setting to default parent photo.\n";
        
        $defaultPhoto = 'default_parent.png';
        $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
        if ($updateStmt->execute([$defaultPhoto, $userId])) {
            echo "✅ Set to default parent photo: $defaultPhoto\n";
        } else {
            echo "❌ Failed to set default photo.\n";
        }
    }
    
    echo "\n🎉 Fix completed! Please refresh the Parent Details page.\n";
    
} catch (Exception $e) {
    echo "❌ Fix failed: " . $e->getMessage() . "\n";
}
?>
