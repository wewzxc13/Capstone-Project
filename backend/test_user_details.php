<?php
// Simple test file for get_user_details.php
// This file helps verify the API is working correctly

echo "<h2>Testing get_user_details.php API</h2>";

// Test data - replace with actual user ID from your database
$testUserId = 1; // Change this to an actual user ID from your database

echo "<p>Testing with User ID: $testUserId</p>";

// Simulate the API call
$data = json_encode(['user_id' => $testUserId]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $data
    ]
]);

$url = 'http://localhost/capstone-project/backend/Users/get_user_details.php';
$result = file_get_contents($url, false, $context);

echo "<h3>API Response:</h3>";
echo "<pre>";
print_r(json_decode($result, true));
echo "</pre>";

// Also test with invalid user ID
echo "<h3>Testing with Invalid User ID (999):</h3>";
$invalidData = json_encode(['user_id' => 999]);
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $invalidData
    ]
]);

$result = file_get_contents($url, false, $context);
echo "<pre>";
print_r(json_decode($result, true));
echo "</pre>";
?> 