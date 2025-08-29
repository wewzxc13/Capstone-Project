<?php
/**
 * Test script for update_school_year_timeline.php
 * This script tests the API endpoint with sample data
 */

echo "<h2>Testing School Year Timeline Update API</h2>";

// Sample data for testing
$testData = [
    'quarters' => [
        [
            'quarter_id' => 1,
            'quarter_name' => '1st Quarter',
            'start_date' => '2025-08-04',
            'end_date' => '2025-10-05'
        ],
        [
            'quarter_id' => 2,
            'quarter_name' => '2nd Quarter',
            'start_date' => '2025-10-06',
            'end_date' => '2025-12-07'
        ],
        [
            'quarter_id' => 3,
            'quarter_name' => '3rd Quarter',
            'start_date' => '2025-12-08',
            'end_date' => '2026-02-08'
        ],
        [
            'quarter_id' => 4,
            'quarter_name' => '4th Quarter',
            'start_date' => '2026-02-09',
            'end_date' => '2026-04-13'
        ]
    ]
];

echo "<h3>Test Data:</h3>";
echo "<pre>" . json_encode($testData, JSON_PRETTY_PRINT) . "</pre>";

// Test the API endpoint
$url = 'http://localhost/capstone-project/backend/Logs/update_school_year_timeline.php';

echo "<h3>Making API Request to:</h3>";
echo "<p>$url</p>";

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen(json_encode($testData))
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Execute the request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

// Close cURL
curl_close($ch);

echo "<h3>Response Details:</h3>";
echo "<p><strong>HTTP Status Code:</strong> $httpCode</p>";

if ($error) {
    echo "<p><strong>cURL Error:</strong> $error</p>";
} else {
    echo "<p><strong>Raw Response:</strong></p>";
    echo "<pre>$response</pre>";
    
    // Try to decode JSON response
    $decodedResponse = json_decode($response, true);
    if ($decodedResponse) {
        echo "<p><strong>Decoded Response:</strong></p>";
        echo "<pre>" . json_encode($decodedResponse, JSON_PRETTY_PRINT) . "</pre>";
        
        if (isset($decodedResponse['success']) && $decodedResponse['success']) {
            echo "<p style='color: green;'><strong>✅ SUCCESS:</strong> " . $decodedResponse['message'] . "</p>";
            
            if (isset($decodedResponse['data'])) {
                echo "<p><strong>Updated Quarters:</strong> " . $decodedResponse['data']['updated_quarters'] . "</p>";
                echo "<p><strong>Total Duration:</strong> " . $decodedResponse['data']['total_duration_days'] . " days (" . $decodedResponse['data']['total_duration_months'] . " months)</p>";
            }
        } else {
            echo "<p style='color: red;'><strong>❌ ERROR:</strong> " . ($decodedResponse['message'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p style='color: red;'><strong>❌ ERROR:</strong> Invalid JSON response</p>";
    }
}

echo "<hr>";
echo "<h3>Test Completed</h3>";
echo "<p>Check the response above to verify the API is working correctly.</p>";
?>
