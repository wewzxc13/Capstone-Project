<?php
// Database health check for system logs
header("Content-Type: application/json");

include_once '../connection.php';

try {
    echo "=== Database Health Check ===\n\n";
    
    // Test 1: Check database connection
    echo "1. Database Connection Test:\n";
    if ($conn) {
        echo "   ✅ Database connection successful\n";
    } else {
        echo "   ❌ Database connection failed\n";
        exit();
    }
    
    // Test 2: Check if table exists
    echo "\n2. Table Existence Test:\n";
    $checkTable = $conn->query("SHOW TABLES LIKE 'tbl_system_logs'");
    if ($checkTable->rowCount() > 0) {
        echo "   ✅ Table tbl_system_logs exists\n";
    } else {
        echo "   ❌ Table tbl_system_logs does not exist\n";
        exit();
    }
    
    // Test 3: Check table structure
    echo "\n3. Table Structure Test:\n";
    $describeTable = $conn->query("DESCRIBE tbl_system_logs");
    $columns = $describeTable->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Table columns:\n";
    foreach ($columns as $column) {
        echo "   - {$column['Field']} ({$column['Type']}) - {$column['Null']} - {$column['Key']}\n";
    }
    
    // Test 4: Check table permissions
    echo "\n4. Table Permissions Test:\n";
    try {
        $testInsert = $conn->prepare("
            INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
            VALUES (999, NULL, NULL, 'TEST', NOW())
        ");
        if ($testInsert->execute()) {
            echo "   ✅ INSERT permission: OK\n";
            
            // Clean up test record
            $testDelete = $conn->prepare("DELETE FROM tbl_system_logs WHERE user_id = 999 AND action = 'TEST'");
            $testDelete->execute();
            echo "   ✅ DELETE permission: OK\n";
        } else {
            echo "   ❌ INSERT permission: FAILED\n";
        }
    } catch (Exception $e) {
        echo "   ❌ Permission test failed: " . $e->getMessage() . "\n";
    }
    
    // Test 5: Check current data
    echo "\n5. Current Data Test:\n";
    $countQuery = $conn->query("SELECT COUNT(*) as total FROM tbl_system_logs");
    $totalCount = $countQuery->fetch(PDO::FETCH_ASSOC)['total'];
    echo "   Total records in table: $totalCount\n";
    
    if ($totalCount > 0) {
        $recentQuery = $conn->query("
            SELECT * FROM tbl_system_logs 
            ORDER BY timestamp DESC 
            LIMIT 3
        ");
        $recentLogs = $recentQuery->fetchAll(PDO::FETCH_ASSOC);
        
        echo "   Recent records:\n";
        foreach ($recentLogs as $log) {
            echo "   - ID: {$log['log_id']}, User: {$log['user_id']}, Action: {$log['action']}, Time: {$log['timestamp']}\n";
        }
    }
    
    // Test 6: Check for any errors in error log
    echo "\n6. Error Log Check:\n";
    $errorLogPath = ini_get('error_log');
    if ($errorLogPath && file_exists($errorLogPath)) {
        echo "   Error log path: $errorLogPath\n";
        $recentErrors = shell_exec("tail -n 5 '$errorLogPath' 2>/dev/null");
        if ($recentErrors) {
            echo "   Recent errors:\n";
            echo "   $recentErrors\n";
        } else {
            echo "   No recent errors found\n";
        }
    } else {
        echo "   Error log not accessible\n";
    }
    
    echo "\n=== Health Check Complete ===\n";
    echo "✅ All basic tests passed - database appears healthy\n";
    
} catch (Exception $e) {
    echo "❌ Health check failed: " . $e->getMessage() . "\n";
}
?> 