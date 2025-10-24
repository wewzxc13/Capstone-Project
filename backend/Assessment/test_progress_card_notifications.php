<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo "<h2>Testing Progress Card Notifications API</h2>";

// Test cases
$test_cases = [
    [
        'name' => 'Test Case 1: Super Admin - Should see all progress card notifications',
        'data' => [
            'user_id' => 1,
            'user_role' => 'Super Admin'
        ]
    ],
    [
        'name' => 'Test Case 2: Teacher - Should see only their own progress card notifications',
        'data' => [
            'user_id' => 2,
            'user_role' => 'Teacher'
        ]
    ],
    [
        'name' => 'Test Case 3: Admin - Should see empty array (not allowed)',
        'data' => [
            'user_id' => 3,
            'user_role' => 'Admin'
        ]
    ],
    [
        'name' => 'Test Case 4: Parent - Should see empty array (not allowed)',
        'data' => [
            'user_id' => 4,
            'user_role' => 'Parent'
        ]
    ]
];

foreach ($test_cases as $test_case) {
    echo "<h3>{$test_case['name']}</h3>";
    
    $json_data = json_encode($test_case['data']);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost/capstone-project/backend/Assessment/get_progress_card_notifications.php');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($json_data)
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "<p><strong>Request:</strong></p>";
    echo "<pre>" . htmlspecialchars($json_data) . "</pre>";
    
    echo "<p><strong>Response (HTTP {$http_code}):</strong></p>";
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
    
    echo "<hr>";
}

echo "<h3>Manual Testing Instructions:</h3>";
echo "<ol>";
echo "<li>Login as a Teacher and create/update a progress card for a student in their advisory</li>";
echo "<li>Check the topbar notification bell - should show a blue notification</li>";
echo "<li>Login as Super Admin - should see all progress card notifications</li>";
echo "<li>Login as Admin or Parent - should not see progress card notifications</li>";
echo "</ol>";

echo "<h3>Expected Behavior:</h3>";
echo "<ul>";
echo "<li><strong>Super Admin:</strong> Can see all progress card notifications from all teachers</li>";
echo "<li><strong>Teacher:</strong> Can only see progress card notifications for students in their advisory</li>";
echo "<li><strong>Admin/Parent:</strong> Should not see any progress card notifications</li>";
echo "<li><strong>Notification Color:</strong> Blue dot and blue text for progress card notifications</li>";
echo "</ul>";
?> 