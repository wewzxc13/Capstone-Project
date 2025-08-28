<?php
// Test script for system logs
header("Content-Type: application/json");

include_once '../connection.php';

try {
    // Test 1: Check if table exists
    $checkTable = $conn->query("SHOW TABLES LIKE 'tbl_system_logs'");
    if ($checkTable->rowCount() == 0) {
        echo json_encode([
            "success" => false,
            "message" => "Table tbl_system_logs does not exist"
        ]);
        exit();
    }
    
    // Test 2: Check table structure
    $describeTable = $conn->query("DESCRIBE tbl_system_logs");
    $columns = $describeTable->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 3: Get recent logs
    $recentLogs = $conn->query("
        SELECT * FROM tbl_system_logs 
        ORDER BY timestamp DESC 
        LIMIT 10
    ");
    $logs = $recentLogs->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 4: Count login/logout records for today
    $todayStats = $conn->query("
        SELECT 
            action,
            COUNT(*) as count
        FROM tbl_system_logs 
        WHERE DATE(timestamp) = CURDATE()
        GROUP BY action
    ");
    $stats = $todayStats->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "message" => "System logs test completed",
        "table_exists" => true,
        "columns" => $columns,
        "recent_logs" => $logs,
        "today_stats" => $stats
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Test failed: " . $e->getMessage()
    ]);
}
?> 