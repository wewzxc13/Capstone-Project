<?php
// Test script to verify login/logout fix prevents immediate logout events
header("Content-Type: application/json");

include_once '../connection.php';

try {
    // Test 1: Simulate a login
    $testUserId = 10; // Use the user ID from your example
    
    echo "=== Testing Login/Logout Fix ===\n\n";
    
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
    
    // Test 2: Simulate immediate logout attempt (should fail)
    echo "Testing immediate logout prevention...\n";
    
    $immediateLogoutData = [
        'user_id' => $testUserId,
        'action' => 'Logout'
    ];
    
    // Make a request to create_system_log.php
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://localhost/capstone-project/backend/Logs/create_system_log.php");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($immediateLogoutData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLOPT_HTTP_CODE);
    curl_close($ch);
    
    echo "Immediate logout attempt response (HTTP $httpCode):\n";
    echo $response . "\n\n";
    
    // Test 3: Check if any new logout was created
    $newLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $newLogsData = $newLogs->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Logs after immediate logout attempt:\n";
    foreach ($newLogsData as $log) {
        echo "- {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
    }
    
    // Test 4: Verify the fix
    $loginCount = 0;
    $logoutCount = 0;
    foreach ($newLogsData as $log) {
        if ($log['action'] === 'Login') $loginCount++;
        if ($log['action'] === 'Logout') $logoutCount++;
    }
    
    echo "\n=== Test Results ===\n";
    echo "Total logins: $loginCount\n";
    echo "Total logouts: $logoutCount\n";
    
    if ($loginCount >= $logoutCount) {
        echo "✅ SUCCESS: Login count >= Logout count (no orphaned logouts)\n";
    } else {
        echo "❌ FAILURE: More logouts than logins detected\n";
    }
    
    // Test 5: Check for any logouts within 30 seconds of login
    $recentLogs = $conn->query("
        SELECT l1.*, l2.timestamp as login_time, 
               TIMESTAMPDIFF(SECOND, l2.timestamp, l1.timestamp) as seconds_diff
        FROM tbl_system_logs l1
        JOIN tbl_system_logs l2 ON l1.user_id = l2.user_id
        WHERE l1.user_id = $testUserId 
        AND l1.action = 'Logout'
        AND l2.action = 'Login'
        AND l2.timestamp < l1.timestamp
        AND l2.timestamp = (
            SELECT MAX(timestamp) 
            FROM tbl_system_logs l3 
            WHERE l3.user_id = l1.user_id 
            AND l3.action = 'Login' 
            AND l3.timestamp < l1.timestamp
        )
        ORDER BY l1.timestamp DESC
    ");
    $recentLogsData = $recentLogs->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nLogouts with time difference from previous login:\n";
    foreach ($recentLogsData as $log) {
        echo "- Logout at {$log['timestamp']} (ID: {$log['log_id']}) - {$log['seconds_diff']} seconds after login\n";
        
        if ($log['seconds_diff'] < 30) {
            echo "  ⚠️  WARNING: Logout within 30 seconds of login!\n";
        }
    }
    
    echo "\n=== Fix Verification ===\n";
    $hasImmediateLogout = false;
    foreach ($recentLogsData as $log) {
        if ($log['seconds_diff'] < 30) {
            $hasImmediateLogout = true;
            break;
        }
    }
    
    if (!$hasImmediateLogout) {
        echo "✅ SUCCESS: No immediate logout events detected\n";
    } else {
        echo "❌ FAILURE: Immediate logout events still present\n";
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Test failed: " . $e->getMessage()
    ]);
}
?> 