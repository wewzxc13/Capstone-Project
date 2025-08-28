<?php
// Test script for system logging functionality
include_once '../connection.php';

echo "<h2>Testing System Log Insertion</h2>";

try {
    // Test 1: Insert a login log
    echo "<h3>Test 1: Inserting Login Log</h3>";
    $loginQuery = $conn->prepare("
        INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
        VALUES (1, NULL, NULL, 'Login', NOW())
    ");
    
    if ($loginQuery->execute()) {
        echo "✅ Login log inserted successfully. Log ID: " . $conn->lastInsertId() . "<br>";
    } else {
        echo "❌ Failed to insert login log<br>";
    }
    
    // Test 2: Try to insert another login log for the same user today (should be prevented)
    echo "<h3>Test 2: Testing Duplicate Login Prevention</h3>";
    $duplicateLoginQuery = $conn->prepare("
        INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
        VALUES (1, NULL, NULL, 'Login', NOW())
    ");
    
    if ($duplicateLoginQuery->execute()) {
        echo "⚠️ Duplicate login log inserted (duplicate prevention not working)<br>";
    } else {
        echo "✅ Duplicate login prevented successfully<br>";
    }
    
    // Test 3: Insert a logout log (should work since login exists)
    echo "<h3>Test 3: Inserting Logout Log</h3>";
    $logoutQuery = $conn->prepare("
        INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
        VALUES (1, NULL, NULL, 'Logout', NOW())
    ");
    
    if ($logoutQuery->execute()) {
        echo "✅ Logout log inserted successfully. Log ID: " . $conn->lastInsertId() . "<br>";
    } else {
        echo "❌ Failed to insert logout log<br>";
    }
    
    // Test 4: Try to insert another logout log immediately (should be prevented)
    echo "<h3>Test 4: Testing Duplicate Logout Prevention</h3>";
    $duplicateLogoutQuery = $conn->prepare("
        INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
        VALUES (1, NULL, NULL, 'Logout', NOW())
    ");
    
    if ($duplicateLogoutQuery->execute()) {
        echo "⚠️ Duplicate logout log inserted (duplicate prevention not working)<br>";
    } else {
        echo "✅ Duplicate logout prevented successfully<br>";
    }
    
    // Test 5: Try to insert logout for user without login today (should be prevented)
    echo "<h3>Test 5: Testing Logout Without Login Prevention</h3>";
    $logoutWithoutLoginQuery = $conn->prepare("
        INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
        VALUES (999, NULL, NULL, 'Logout', NOW())
    ");
    
    if ($logoutWithoutLoginQuery->execute()) {
        echo "⚠️ Logout without login was inserted (validation not working)<br>";
    } else {
        echo "✅ Logout without login prevented successfully<br>";
    }
    
    // Test 6: View recent logs
    echo "<h3>Test 6: Viewing Recent Logs</h3>";
    $viewQuery = $conn->prepare("
        SELECT * FROM tbl_system_logs 
        WHERE action IN ('Login', 'Logout') 
        ORDER BY timestamp DESC 
        LIMIT 10
    ");
    $viewQuery->execute();
    $logs = $viewQuery->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($logs) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Log ID</th><th>User ID</th><th>Target User ID</th><th>Target Student ID</th><th>Action</th><th>Timestamp</th></tr>";
        
        foreach ($logs as $log) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($log['log_id']) . "</td>";
            echo "<td>" . htmlspecialchars($log['user_id']) . "</td>";
            echo "<td>" . ($log['target_user_id'] ? htmlspecialchars($log['target_user_id']) : 'NULL') . "</td>";
            echo "<td>" . ($log['target_student_id'] ? htmlspecialchars($log['target_student_id']) : 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($log['action']) . "</td>";
            echo "<td>" . htmlspecialchars($log['timestamp']) . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "No logs found.";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?> 