<?php
// Quick fix for Margareths Pabunan Manongdo's DSC02412 photo filename mismatch
include_once '../connection.php';

try {
    echo "=== FIXING MARGARETHS' DSC02412 PHOTO ===\n\n";
    
    // Find the specific user - Margareths Pabunan Manongdo
    $stmt = $conn->prepare("SELECT user_id, user_firstname, user_middlename, user_lastname, user_photo FROM tbl_users WHERE user_email = 'manongdomargareth1335@gmail.com'");
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
    
    // The correct filename based on the file manager screenshot
    $correctFilename = 'img_2arsk_DSC02412.jpg';
    
    if ($currentPhoto !== $correctFilename) {
        echo "🔧 Fixing filename mismatch...\n";
        echo "   From: $currentPhoto\n";
        echo "   To:   $correctFilename\n";
        
        // Update to the correct filename
        $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
        if ($updateStmt->execute([$correctFilename, $userId])) {
            echo "✅ SUCCESS! Photo filename updated in database.\n";
            echo "   The photo should now load at: https://learnersville.online/backend-ville/Uploads/$correctFilename\n";
        } else {
            echo "❌ FAILED to update database.\n";
        }
    } else {
        echo "✅ Photo filename is already correct: $currentPhoto\n";
    }
    
    echo "\n🎉 Fix completed! Please refresh the Parent Details page to see the photo.\n";
    
} catch (Exception $e) {
    echo "❌ Fix failed: " . $e->getMessage() . "\n";
}
?>
