<?php
include_once 'connection.php';

try {
    // Fetch users where is_new = 'Yes'
    $stmt = $conn->prepare("SELECT user_id, user_firstname FROM tbl_users WHERE is_new = 'Yes'");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Set the fixed password
    $hashedPassword = password_hash("Learnersville", PASSWORD_BCRYPT);

    // Update password for each matched user
    foreach ($users as $user) {
        $updateStmt = $conn->prepare("UPDATE tbl_users SET user_pass = :pass WHERE user_id = :id");
        $updateStmt->bindParam(':pass', $hashedPassword);
        $updateStmt->bindParam(':id', $user['user_id']);
        $updateStmt->execute();

        echo "Password updated for {$user['user_firstname']} (ID: {$user['user_id']})<br>";
    }

    echo "<br><strong>Passwords updated to 'Learnersville' for all users where is_new = 'Yes'.</strong>";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
