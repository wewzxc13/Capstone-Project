<?php
// Simple test script to verify logout logging is working
header("Content-Type: application/json");

include_once '../connection.php';

try {
    $testUserId = 22; // Use the user ID from your example
    
    echo "=== Testing Logout Logging for User ID: $testUserId ===\n\n";
    
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
    
    // Check when user 22 last logged in
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
        
        echo "Last login time: " . $lastLoginResult['last_login_time'] . "\n";
        echo "Current time: " . date('Y-m-d H:i:s', $currentTime) . "\n";
        echo "Time difference: $timeDifference seconds\n\n";
        
        // Check if enough time has passed (should be > 5 seconds)
        if ($timeDifference < 5) {
            echo "⚠️  WARNING: Not enough time has passed since login ($timeDifference seconds < 5 seconds)\n";
            echo "This logout attempt will be rejected by the 5-second buffer.\n\n";
        } else {
            echo "✅ Sufficient time has passed since login ($timeDifference seconds >= 5 seconds)\n";
            echo "This logout attempt should succeed.\n\n";
        }
    }
    
    // Test 1: Try to create a logout log
    echo "Testing logout creation...\n";
    
    $logoutData = [
        'user_id' => $testUserId,
        'action' => 'Logout'
    ];
    
    // Make a request to create_system_log.php
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://localhost/capstone-project/backend/Logs/create_system_log.php");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($logoutData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLOPT_HTTP_CODE);
    curl_close($ch);
    
    echo "Logout attempt response (HTTP $httpCode):\n";
    echo $response . "\n\n";
    
    // Test 2: Check if logout was created
    $newLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $newLogsData = $newLogs->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Logs after logout attempt:\n";
    foreach ($newLogsData as $log) {
        echo "- {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
    }
    
    // Test 3: Check if new logout was added
    $originalCount = count($logs);
    $newCount = count($newLogsData);
    
    echo "\n=== Test Results ===\n";
    echo "Original log count: $originalCount\n";
    echo "New log count: $newCount\n";
    
    if ($newCount > $originalCount) {
        echo "✅ SUCCESS: New logout log was created\n";
    } else {
        echo "❌ FAILURE: No new logout log was created\n";
        
        // Check what the response was
        $responseData = json_decode($response, true);
        if ($responseData) {
            echo "Response message: " . ($responseData['message'] ?? 'Unknown') . "\n";
            if (isset($responseData['skipped']) && $responseData['skipped']) {
                echo "Logout was skipped (duplicate prevention)\n";
            }
        }
    }
    
    // Test 4: Check for any errors in the response
    if ($httpCode !== 200) {
        echo "⚠️  WARNING: HTTP response code is $httpCode (not 200)\n";
    }
    
    // Test 5: Check PHP error log for any backend errors
    echo "\n=== Backend Error Check ===\n";
    $errorLogPath = ini_get('error_log');
    if ($errorLogPath && file_exists($errorLogPath)) {
        echo "Error log path: $errorLogPath\n";
        $recentErrors = shell_exec("tail -n 10 '$errorLogPath' 2>/dev/null");
        if ($recentErrors) {
            echo "Recent errors:\n";
            echo $recentErrors . "\n";
        } else {
            echo "No recent errors found\n";
        }
    } else {
        echo "Error log not accessible\n";
    }
    
} catch (Exception $e) {
    echo "Test failed: " . $e->getMessage() . "\n";
}
?> 