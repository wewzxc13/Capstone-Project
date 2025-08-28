<?php
// Debug script to identify logout issue
header("Content-Type: text/plain");

include_once '../connection.php';

try {
    $testUserId = 22; // Use the user ID from your example
    
    echo "=== Debugging Logout Issue for User ID: $testUserId ===\n\n";
    
    // Check current state
    echo "1. Current Logs for User $testUserId:\n";
    $currentLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $logs = $currentLogs->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($logs as $log) {
        echo "   - {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
    }
    echo "\n";
    
    // Check validation logic step by step
    echo "2. Testing Logout Validation Logic:\n";
    
    // Step 1: Check for recent logout records (within 2 minutes)
    echo "   Step 1: Checking for recent logout records (within 2 minutes)...\n";
    $recentLogoutQuery = $conn->query("
        SELECT COUNT(*) as recent_count 
        FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        AND action = 'Logout' 
        AND timestamp > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    ");
    $recentLogoutResult = $recentLogoutQuery->fetch(PDO::FETCH_ASSOC);
    $recentLogoutCount = $recentLogoutResult['recent_count'];
    echo "   Recent logout count: $recentLogoutCount\n";
    
    if ($recentLogoutCount > 0) {
        echo "   ❌ Logout would be rejected - recent logout exists\n";
        echo "   This is why logout is not working!\n";
    } else {
        echo "   ✅ No recent logout found - proceeding to next check\n";
    }
    
    // Step 2: Check if user has recent login (within 24 hours)
    echo "\n   Step 2: Checking for recent login records (within 24 hours)...\n";
    $recentLoginQuery = $conn->query("
        SELECT COUNT(*) as recent_count 
        FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        AND action = 'Login' 
        AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    $recentLoginResult = $recentLoginQuery->fetch(PDO::FETCH_ASSOC);
    $recentLoginCount = $recentLoginResult['recent_count'];
    echo "   Recent login count: $recentLoginCount\n";
    
    if ($recentLoginCount == 0) {
        echo "   ❌ Logout would be rejected - no recent login found\n";
    } else {
        echo "   ✅ Recent login found - proceeding to next check\n";
    }
    
    // Step 3: Check time since last login
    echo "\n   Step 3: Checking time since last login...\n";
    $lastLoginQuery = $conn->query("
        SELECT timestamp as last_login_time
        FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        AND action = 'Login' 
        ORDER BY timestamp DESC 
        LIMIT 1
    ");
    $lastLoginResult = $lastLoginQuery->fetch(PDO::FETCH_ASSOC);
    
    if ($lastLoginResult) {
        $lastLoginTime = strtotime($lastLoginResult['last_login_time']);
        $currentTime = time();
        $timeDifference = $currentTime - $lastLoginTime;
        
        echo "   Last login time: " . $lastLoginResult['last_login_time'] . "\n";
        echo "   Current time: " . date('Y-m-d H:i:s', $currentTime) . "\n";
        echo "   Time difference: $timeDifference seconds\n";
        
        if ($timeDifference < 5) {
            echo "   ❌ Logout would be rejected - too close to login ($timeDifference seconds < 5 seconds)\n";
        } else {
            echo "   ✅ Sufficient time has passed since login ($timeDifference seconds >= 5 seconds)\n";
        }
    }
    
    echo "\n";
    
    // Test 3: Try to create a logout log directly
    echo "3. Testing Direct Logout Creation:\n";
    try {
        $directInsert = $conn->prepare("
            INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
            VALUES (:user_id, NULL, NULL, 'Logout', NOW())
        ");
        $directInsert->bindParam(":user_id", $testUserId);
        
        if ($directInsert->execute()) {
            echo "   ✅ Direct insert successful - logout log created\n";
            echo "   New log ID: " . $conn->lastInsertId() . "\n";
            
            // Check if it was actually created
            $newLogs = $conn->query("
                SELECT * FROM tbl_system_logs 
                WHERE user_id = $testUserId 
                ORDER BY timestamp DESC 
                LIMIT 5
            ");
            $newLogsData = $newLogs->fetchAll(PDO::FETCH_ASSOC);
            
            echo "\n   Updated logs:\n";
            foreach ($newLogsData as $log) {
                echo "   - {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
            }
        } else {
            echo "   ❌ Direct insert failed\n";
        }
    } catch (Exception $e) {
        echo "   ❌ Direct insert error: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== Debug Complete ===\n";
    
    // Summary
    echo "\n=== SUMMARY ===\n";
    if ($recentLogoutCount > 0) {
        echo "❌ ISSUE IDENTIFIED: Recent logout exists within 2 minutes\n";
        echo "   Solution: Wait for 2 minutes or reduce the 2-minute buffer\n";
    } elseif ($recentLoginCount == 0) {
        echo "❌ ISSUE IDENTIFIED: No recent login found within 24 hours\n";
        echo "   Solution: Check login logging or reduce 24-hour requirement\n";
    } else {
        echo "✅ All validation checks passed - logout should work\n";
        echo "   If logout still doesn't work, check frontend code\n";
    }
    
} catch (Exception $e) {
    echo "Debug failed: " . $e->getMessage() . "\n";
}
?> 