<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

// Test parameters
$test_user_id = 5; // Teacher ID
$test_user_role = 'Teacher';

echo "Testing get_overall_progress_notifications.php with:\n";
echo "user_id: $test_user_id\n";
echo "user_role: $test_user_role\n\n";

// Simulate POST request
$_POST['user_id'] = $test_user_id;
$_POST['user_role'] = $test_user_role;

// Include the actual API file
ob_start();
include 'get_overall_progress_notifications.php';
$output = ob_get_clean();

echo "API Response:\n";
echo $output;
?> 