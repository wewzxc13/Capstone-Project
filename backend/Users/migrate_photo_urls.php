<?php
// Migration script to convert full photo URLs to filenames only
include_once '../connection.php';

try {
    // Get all users with photo URLs
    $stmt = $conn->prepare("SELECT user_id, user_photo FROM tbl_users WHERE user_photo IS NOT NULL AND user_photo != ''");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updatedCount = 0;
    $errors = [];
    
    foreach ($users as $user) {
        $photoUrl = $user['user_photo'];
        $userId = $user['user_id'];
        
        // Extract filename from full URL
        if (strpos($photoUrl, 'http://localhost/capstone-project/backend/Uploads/') === 0) {
            $filename = str_replace('http://localhost/capstone-project/backend/Uploads/', '', $photoUrl);
            
            // Update the database with filename only
            $updateStmt = $conn->prepare("UPDATE tbl_users SET user_photo = ? WHERE user_id = ?");
            if ($updateStmt->execute([$filename, $userId])) {
                $updatedCount++;
                echo "Updated user $userId: $photoUrl -> $filename\n";
            } else {
                $errors[] = "Failed to update user $userId";
            }
        } else {
            echo "User $userId already has filename format: $photoUrl\n";
        }
    }
    
    echo "\nMigration completed!\n";
    echo "Updated records: $updatedCount\n";
    if (!empty($errors)) {
        echo "Errors: " . count($errors) . "\n";
        foreach ($errors as $error) {
            echo "- $error\n";
        }
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
