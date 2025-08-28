<?php
// Simple test for get_all_users.php
echo "<h2>Testing get_all_users.php API</h2>";

// Test the API directly
$url = 'http://localhost/capstone-project/backend/Users/get_all_users.php';

// Use cURL to test the API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<h3>HTTP Response Code: $httpCode</h3>";
echo "<h3>Response:</h3>";
echo "<pre>";
print_r(json_decode($response, true));
echo "</pre>";

// Also test the database connection directly
echo "<h3>Direct Database Test:</h3>";
include_once 'connection.php';

try {
    // Test roles table
    echo "<h4>Roles in database:</h4>";
    $stmt = $conn->prepare("SELECT * FROM tbl_roles");
    $stmt->execute();
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($roles);
    echo "</pre>";

    // Test users table
    echo "<h4>Sample users in database:</h4>";
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_lastname,
            u.user_role,
            r.role_name
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Active'
        LIMIT 5
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($users);
    echo "</pre>";

    // Test students table
    echo "<h4>Sample students in database:</h4>";
    $stmt = $conn->prepare("
        SELECT 
            s.student_id,
            s.stud_firstname,
            s.stud_lastname,
            s.level_id,
            sl.level_name
        FROM tbl_students s
        LEFT JOIN tbl_student_levels sl ON s.level_id = sl.level_id
        WHERE s.stud_school_status = 'Active'
        LIMIT 5
    ");
    $stmt->execute();
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($students);
    echo "</pre>";

} catch (PDOException $e) {
    echo "<h4>Database Error:</h4>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?> 