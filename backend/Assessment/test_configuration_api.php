<?php
// Test script for Configuration API endpoints
echo "<h1>Configuration API Test</h1>";

// Test 1: Test detailed activity data endpoint
echo "<h2>Test 1: Detailed Activity Data</h2>";
$url1 = "http://localhost/capstone-project/backend/Assessment/get_detailed_activity_data.php";
echo "<p>Testing: $url1</p>";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response1 = curl_exec($ch);
$httpCode1 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p>HTTP Code: $httpCode1</p>";
if ($response1) {
    $data1 = json_decode($response1, true);
    if ($data1 && isset($data1['success'])) {
        echo "<p style='color: green;'>✓ Success: " . $data1['message'] . "</p>";
        echo "<p>Total Activities: " . ($data1['data']['total_activities'] ?? 'N/A') . "</p>";
        echo "<p>Total Subjects: " . count($data1['data']['subjects'] ?? []) . "</p>";
        echo "<p>Total Quarters: " . count($data1['data']['quarters'] ?? []) . "</p>";
        echo "<p>Total Advisory Classes: " . count($data1['data']['advisory'] ?? []) . "</p>";
    } else {
        echo "<p style='color: red;'>✗ Failed to parse response</p>";
        echo "<pre>" . htmlspecialchars($response1) . "</pre>";
    }
} else {
    echo "<p style='color: red;'>✗ No response received</p>";
}

echo "<hr>";

// Test 2: Test table structure endpoint
echo "<h2>Test 2: Table Structure</h2>";
$url2 = "http://localhost/capstone-project/backend/Assessment/get_all_activity_tables.php";
echo "<p>Testing: $url2</p>";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url2);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response2 = curl_exec($ch);
$httpCode2 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p>HTTP Code: $httpCode2</p>";
if ($response2) {
    $data2 = json_decode($response2, true);
    if ($data2 && isset($data2['success'])) {
        echo "<p style='color: green;'>✓ Success: " . $data2['message'] . "</p>";
        echo "<p>Total Tables: " . ($data2['summary']['total_tables'] ?? 'N/A') . "</p>";
        echo "<p>Existing Tables: " . ($data2['summary']['existing_tables'] ?? 'N/A') . "</p>";
        
        if (isset($data2['data'])) {
            echo "<h3>Tables Found:</h3>";
            foreach ($data2['data'] as $tableName => $tableInfo) {
                echo "<p><strong>$tableName</strong> - Records: " . ($tableInfo['total_records'] ?? 0) . 
                     ", Columns: " . count($tableInfo['columns'] ?? []) . "</p>";
            }
        }
    } else {
        echo "<p style='color: red;'>✗ Failed to parse response</p>";
        echo "<pre>" . htmlspecialchars($response2) . "</pre>";
    }
} else {
    echo "<p style='color: red;'>✗ No response received</p>";
}

echo "<hr>";

// Test 3: Test database connection
echo "<h2>Test 3: Database Connection</h2>";
require_once '../connection.php';

if ($conn) {
    echo "<p style='color: green;'>✓ Database connection successful</p>";
    
    // Test basic queries
    $tables = ['tbl_activities', 'tbl_subjects', 'tbl_quarters', 'tbl_advisory'];
    
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result && $result->num_rows > 0) {
            $count = $conn->query("SELECT COUNT(*) as count FROM $table")->fetch_assoc()['count'];
            echo "<p style='color: green;'>✓ Table $table exists with $count records</p>";
        } else {
            echo "<p style='color: orange;'>⚠ Table $table does not exist</p>";
        }
    }
    
    $conn->close();
} else {
    echo "<p style='color: red;'>✗ Database connection failed</p>";
}

echo "<hr>";
echo "<p><strong>Test completed.</strong></p>";
?>
