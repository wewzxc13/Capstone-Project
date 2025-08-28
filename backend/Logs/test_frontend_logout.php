<?php
// Test script to simulate frontend logout request
header("Content-Type: application/json");

include_once '../connection.php';

try {
    $testUserId = 22; // Use the user ID from your example
    
    echo "=== Testing Frontend Logout Simulation ===\n\n";
    
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
    
    // Simulate the exact request that the frontend would send
    echo "Simulating frontend logout request...\n";
    
    // Method 1: Direct database insert (bypassing all validation)
    echo "\n1. Testing direct database insert (bypassing validation):\n";
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
    
    // Method 2: Test the API endpoint with different approaches
    echo "\n2. Testing API endpoint with different approaches:\n";
    
    // Test 2a: Direct POST request
    echo "\n2a. Direct POST to create_system_log.php:\n";
    $logoutData = [
        'user_id' => $testUserId,
        'action' => 'Logout'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://localhost/capstone-project/backend/Logs/create_system_log.php");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($logoutData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLOPT_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    echo "   HTTP Code: $httpCode\n";
    echo "   Response: $response\n";
    if ($curlError) {
        echo "   cURL Error: $curlError\n";
    }
    
    // Test 2b: Check if the request actually reached the PHP script
    echo "\n2b. Checking if request reached PHP script:\n";
    $recentLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $recentLogsData = $recentLogs->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Logs after API test:\n";
    foreach ($recentLogsData as $log) {
        echo "   - {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
    }
    
    // Test 3: Check for any validation issues
    echo "\n3. Checking validation logic:\n";
    
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
    
    // Check time since last login
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
        
        echo "   Time since last login: $timeDifference seconds\n";
        
        if ($timeDifference < 5) {
            echo "   ⚠️  This would be rejected by 5-second buffer\n";
        } else {
            echo "   ✅ This should pass the 5-second buffer\n";
        }
    }
    
    echo "\n=== Test Complete ===\n";
    
} catch (Exception $e) {
    echo "Test failed: " . $e->getMessage() . "\n";
}
?> 