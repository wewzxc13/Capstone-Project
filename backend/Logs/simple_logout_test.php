<?php
// Simple logout test without cURL dependency
header("Content-Type: text/plain");

include_once '../connection.php';

try {
    $testUserId = 22; // Use the user ID from your example
    
    echo "=== Simple Logout Test for User ID: $testUserId ===\n\n";
    
    // Check current state
    $currentLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $logs = $currentLogs->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Current logs for user $testUserId:\n";
    foreach ($logs as $log) {
        echo "- {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
    }
    echo "\n";
    
    // Test 1: Direct database insert (bypassing all validation)
    echo "1. Testing direct database insert:\n";
    try {
        $directInsert = $conn->prepare("
            INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
            VALUES (:user_id, NULL, NULL, 'Logout', NOW())
        ");
        $directInsert->bindParam(":user_id", $testUserId);
        
        if ($directInsert->execute()) {
            echo "   ✅ Direct insert successful - logout log created\n";
            echo "   New log ID: " . $conn->lastInsertId() . "\n";
        } else {
            echo "   ❌ Direct insert failed\n";
        }
    } catch (Exception $e) {
        echo "   ❌ Direct insert error: " . $e->getMessage() . "\n";
    }
    
    // Test 2: Check if logout was created
    echo "\n2. Checking if logout was created:\n";
    $newLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $newLogsData = $newLogs->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Logs after insert:\n";
    foreach ($newLogsData as $log) {
        echo "   - {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
    }
    
    // Test 3: Verify the result
    $originalCount = count($logs);
    $newCount = count($newLogsData);
    
    echo "\n=== Test Results ===\n";
    echo "Original log count: $originalCount\n";
    echo "New log count: $newCount\n";
    
    if ($newCount > $originalCount) {
        echo "✅ SUCCESS: New logout log was created\n";
    } else {
        echo "❌ FAILURE: No new logout log was created\n";
    }
    
    // Test 4: Check for any validation issues
    echo "\n4. Checking validation logic:\n";
    
    // Check recent logout count
    $recentLogoutQuery = $conn->query("
        SELECT COUNT(*) as recent_count 
        FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        AND action = 'Logout' 
        AND timestamp > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    ");
    $recentLogoutResult = $recentLogoutQuery->fetch(PDO::FETCH_ASSOC);
    echo "   Recent logout count (within 2 minutes): " . $recentLogoutResult['recent_count'] . "\n";
    
    // Check recent login count
    $recentLoginQuery = $conn->query("
        SELECT COUNT(*) as recent_count 
        FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        AND action = 'Login' 
        AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    $recentLoginResult = $recentLoginQuery->fetch(PDO::FETCH_ASSOC);
    echo "   Recent login count (within 24 hours): " . $recentLoginResult['recent_count'] . "\n";
    
    echo "\n=== Test Complete ===\n";
    
} catch (Exception $e) {
    echo "Test failed: " . $e->getMessage() . "\n";
}
?> 