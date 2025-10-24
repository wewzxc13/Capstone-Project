<?php
// Simple test script for the subject averages API
echo "Testing Subject Averages API\n";
echo "============================\n";

// Test with a sample teacher_id (you may need to adjust this)
$teacher_id = 1; // Replace with an actual teacher ID from your database

$url = "http://localhost/capstone-project/backend/Assessment/get_advisory_subject_averages.php?teacher_id=" . $teacher_id;

echo "Testing URL: " . $url . "\n\n";

$response = file_get_contents($url);
$data = json_decode($response, true);

echo "Response:\n";
print_r($data);

if ($data['status'] === 'success') {
    echo "\n✅ API is working correctly!\n";
    echo "Found " . count($data['data']['labels']) . " subjects\n";
    echo "Average scores: " . implode(', ', $data['data']['scores']) . "\n";
} else {
    echo "\n❌ API returned an error: " . $data['message'] . "\n";
}
?> 