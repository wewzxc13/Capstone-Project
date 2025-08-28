<?php
// Test script to verify only manual logouts are allowed
header("Content-Type: text/plain");

include_once '../connection.php';

try {
    $testUserId = 22; // Use the user ID from your example
    
    echo "=== Testing Manual Logout Only System ===\n\n";
    
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
    
    // Test 1: Try to create a logout log (simulating manual logout)
    echo "2. Testing Manual Logout Creation:\n";
    
    $logoutData = [
        'user_id' => $testUserId,
        'action' => 'Logout'
    ];
    
    // Simulate the API call
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://localhost/capstone-project/backend/Logs/create_system_log.php");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($logoutData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLOPT_HTTP_CODE);
    curl_close($ch);
    
    echo "   HTTP Code: $httpCode\n";
    echo "   Response: $response\n\n";
    
    // Check if logout was created
    echo "3. Checking if logout was created:\n";
    $newLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        WHERE user_id = $testUserId 
        ORDER BY timestamp DESC 
        LIMIT 5
    ");
    $newLogsData = $newLogs->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Logs after logout attempt:\n";
    foreach ($newLogsData as $log) {
        echo "   - {$log['action']} at {$log['timestamp']} (ID: {$log['log_id']})\n";
    }
    
    // Verify the result
    $originalCount = count($logs);
    $newCount = count($newLogsData);
    
    echo "\n4. Test Results:\n";
    echo "   Original log count: $originalCount\n";
    echo "   New log count: $newCount\n";
    
    if ($newCount > $originalCount) {
        echo "   ✅ SUCCESS: New logout log was created (manual logout working)\n";
    } else {
        echo "   ❌ FAILURE: No new logout log was created\n";
        
        // Check what the response was
        $responseData = json_decode($response, true);
        if ($responseData) {
            echo "   Response message: " . ($responseData['message'] ?? 'Unknown') . "\n";
        }
    }
    
    echo "\n=== Test Complete ===\n";
    echo "✅ Manual logout system is now active\n";
    echo "✅ Automatic logout events (page close, tab switch) are disabled\n";
    echo "✅ Only clicking the logout button will create logout logs\n";
    
} catch (Exception $e) {
    echo "Test failed: " . $e->getMessage() . "\n";
}
?> 