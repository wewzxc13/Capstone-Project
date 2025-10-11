<?php
/**
 * Test Script: Check Login Credentials
 * 
 * This script helps you verify if credentials exist in the database
 * and if passwords are properly hashed.
 * 
 * Usage: Visit this file in browser and check the output
 * WARNING: DELETE THIS FILE after testing (contains sensitive debug info)
 */

header("Content-Type: text/html; charset=UTF-8");
include_once 'connection.php';

echo "<h1>🔍 Credential Test Script</h1>";
echo "<p><strong>⚠️ WARNING: DELETE THIS FILE AFTER TESTING!</strong></p>";
echo "<hr>";

try {
    // Check database connection
    if (!$conn) {
        throw new Exception("Database connection failed!");
    }
    
    echo "<h2>✅ Database Connection: SUCCESS</h2>";
    
    // Get all active users
    $query = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_email,
            u.user_firstname,
            u.user_lastname,
            u.user_status,
            r.role_name,
            LENGTH(u.user_pass) as password_length,
            SUBSTRING(u.user_pass, 1, 10) as password_preview
        FROM tbl_users u
        JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Active'
        ORDER BY u.user_id
        LIMIT 10
    ");
    $query->execute();
    $users = $query->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>👥 Active Users in Database:</h2>";
    
    if (empty($users)) {
        echo "<p style='color: red;'>❌ NO ACTIVE USERS FOUND!</p>";
        echo "<p>This is why login is failing. You need to:</p>";
        echo "<ul>";
        echo "<li>Check if users exist in tbl_users table</li>";
        echo "<li>Make sure user_status = 'Active'</li>";
        echo "<li>Verify passwords are properly hashed</li>";
        echo "</ul>";
    } else {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID</th><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Password Hash</th>";
        echo "</tr>";
        
        foreach ($users as $user) {
            $hasValidHash = $user['password_length'] == 60 || $user['password_length'] > 50;
            $hashStatus = $hasValidHash ? "✅ Valid" : "⚠️ Invalid";
            
            echo "<tr>";
            echo "<td>{$user['user_id']}</td>";
            echo "<td><strong>{$user['user_email']}</strong></td>";
            echo "<td>{$user['user_firstname']} {$user['user_lastname']}</td>";
            echo "<td>{$user['role_name']}</td>";
            echo "<td>{$user['user_status']}</td>";
            echo "<td>{$hashStatus} ({$user['password_length']} chars)<br>";
            echo "<small>{$user['password_preview']}...</small></td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        echo "<h3>📝 Test These Credentials:</h3>";
        echo "<p>Try logging in with one of the emails above.</p>";
        echo "<p><strong style='color: red;'>If you don't know the password:</strong></p>";
        echo "<ol>";
        echo "<li>Pick a user email from the table above</li>";
        echo "<li>Create a new password hash using test_password_hash.php</li>";
        echo "<li>Update that user's password in phpMyAdmin</li>";
        echo "<li>Try logging in with the new password</li>";
        echo "</ol>";
    }
    
    // Check for inactive users too
    $inactiveQuery = $conn->prepare("
        SELECT COUNT(*) as count FROM tbl_users WHERE user_status != 'Active'
    ");
    $inactiveQuery->execute();
    $inactiveCount = $inactiveQuery->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "<h3>ℹ️ Additional Info:</h3>";
    echo "<ul>";
    echo "<li>Active users: " . count($users) . "</li>";
    echo "<li>Inactive/Deactivated users: {$inactiveCount}</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h2 style='color: red;'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</h2>";
    
    if (isset($connection_error)) {
        echo "<p><strong>Database Connection Error:</strong> " . htmlspecialchars($connection_error) . "</p>";
        echo "<p><strong>Possible causes:</strong></p>";
        echo "<ul>";
        echo "<li>Missing or incorrect .env file</li>";
        echo "<li>Wrong database credentials</li>";
        echo "<li>Database doesn't exist</li>";
        echo "<li>Database user doesn't have permissions</li>";
        echo "</ul>";
    }
}

echo "<hr>";
echo "<p style='color: red; font-weight: bold;'>⚠️ SECURITY WARNING: DELETE THIS FILE AFTER TESTING!</p>";
echo "<p>This file displays sensitive database information. Remove it from your server immediately after use.</p>";
?>

