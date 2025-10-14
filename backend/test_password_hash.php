<?php
/**
 * Password Hash Generator
 * 
 * This script generates a secure password hash that you can use
 * to update user passwords in the database.
 * 
 * Usage:
 * 1. Visit: test_password_hash.php?password=YourPassword123
 * 2. Copy the generated hash
 * 3. Update the user's password in phpMyAdmin:
 *    UPDATE tbl_users SET user_pass = 'generated_hash' WHERE user_email = 'user@example.com'
 * 4. DELETE THIS FILE after use
 */

header("Content-Type: text/html; charset=UTF-8");

echo "<h1>🔐 Password Hash Generator</h1>";
echo "<p><strong>⚠️ WARNING: DELETE THIS FILE AFTER USE!</strong></p>";
echo "<hr>";

if (isset($_GET['password'])) {
    $password = $_GET['password'];
    
    if (strlen($password) < 6) {
        echo "<p style='color: red;'>❌ Password must be at least 6 characters long</p>";
    } else {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        echo "<h2>✅ Password Hash Generated:</h2>";
        echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<p><strong>Your Password:</strong> " . htmlspecialchars($password) . "</p>";
        echo "<p><strong>Generated Hash:</strong></p>";
        echo "<textarea style='width: 100%; height: 100px; font-family: monospace; font-size: 12px;'>";
        echo $hash;
        echo "</textarea>";
        echo "</div>";
        
        echo "<h3>📝 How to Use This Hash:</h3>";
        echo "<ol>";
        echo "<li>Copy the hash above</li>";
        echo "<li>Go to phpMyAdmin → dblearnsville → tbl_users</li>";
        echo "<li>Find the user you want to update</li>";
        echo "<li>Click 'Edit' on that user row</li>";
        echo "<li>Paste the hash into the 'user_pass' field</li>";
        echo "<li>Save the changes</li>";
        echo "<li>Try logging in with: email + '" . htmlspecialchars($password) . "'</li>";
        echo "</ol>";
        
        echo "<h3>🧪 Test Another Password:</h3>";
        echo "<form method='GET'>";
        echo "<input type='text' name='password' placeholder='Enter password' style='padding: 8px; width: 300px;' required>";
        echo "<button type='submit' style='padding: 8px 20px; background: #4CAF50; color: white; border: none; cursor: pointer;'>Generate Hash</button>";
        echo "</form>";
    }
} else {
    echo "<h2>🚀 Generate a Password Hash</h2>";
    echo "<form method='GET'>";
    echo "<p><input type='text' name='password' placeholder='Enter password to hash' style='padding: 10px; width: 400px; font-size: 16px;' required></p>";
    echo "<button type='submit' style='padding: 10px 30px; background: #4CAF50; color: white; border: none; cursor: pointer; font-size: 16px;'>Generate Hash</button>";
    echo "</form>";
    
    echo "<h3>💡 Examples:</h3>";
    echo "<ul>";
    echo "<li><a href='?password=admin123'>Generate hash for 'admin123'</a></li>";
    echo "<li><a href='?password=teacher123'>Generate hash for 'teacher123'</a></li>";
    echo "<li><a href='?password=Password123'>Generate hash for 'Password123'</a></li>";
    echo "</ul>";
}

echo "<hr>";
echo "<p style='color: red; font-weight: bold;'>⚠️ SECURITY WARNING: DELETE THIS FILE AFTER USE!</p>";
echo "<p>This file can generate password hashes for any password. Remove it immediately after testing.</p>";
?>

