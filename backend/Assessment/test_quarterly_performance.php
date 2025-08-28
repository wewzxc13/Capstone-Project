<?php
// Test script for quarterly performance API
echo "Testing Quarterly Performance API\n";
echo "================================\n";

// Test with a sample teacher_id (you may need to adjust this)
$teacher_id = 1; // Replace with an actual teacher ID from your database

$url = "http://localhost/capstone-project/backend/Assessment/get_class_quarterly_performance.php?teacher_id=" . $teacher_id;

echo "Testing URL: " . $url . "\n\n";

$response = file_get_contents($url);
$data = json_decode($response, true);

echo "Response:\n";
print_r($data);

if ($data['status'] === 'success') {
    echo "\n✅ API is working correctly!\n";
    echo "Quarter scores: " . implode(', ', $data['data']['scores']) . "\n";
    echo "Quarter details:\n";
    foreach ($data['data']['quarter_details'] as $quarter => $details) {
        echo "Quarter $quarter: " . json_encode($details) . "\n";
    }
} else {
    echo "\n❌ API returned an error: " . $data['message'] . "\n";
}
?> 