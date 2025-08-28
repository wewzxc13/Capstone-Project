<?php
// Comprehensive test script for roles and users
// This will help identify why the API only works for Super Admin

include_once 'connection.php';

echo "<h2>Database Structure Analysis</h2>";

try {
    // Check tbl_roles structure
    echo "<h3>1. tbl_roles Table Structure:</h3>";
    $stmt = $conn->prepare("DESCRIBE tbl_roles");
    $stmt->execute();
    $rolesStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($rolesStructure);
    echo "</pre>";

    // Check all roles in the database
    echo "<h3>2. All Roles in tbl_roles:</h3>";
    $stmt = $conn->prepare("SELECT * FROM tbl_roles");
    $stmt->execute();
    $allRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($allRoles);
    echo "</pre>";

    // Check tbl_users structure
    echo "<h3>3. tbl_users Table Structure:</h3>";
    $stmt = $conn->prepare("DESCRIBE tbl_users");
    $stmt->execute();
    $usersStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($usersStructure);
    echo "</pre>";

    // Check sample users with their roles
    echo "<h3>4. Sample Users with Roles:</h3>";
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_lastname,
            u.user_role,
            u.user_status,
            r.role_name
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        LIMIT 10
    ");
    $stmt->execute();
    $sampleUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($sampleUsers);
    echo "</pre>";

    // Test the API with different user IDs
    echo "<h3>5. Testing API with Different User IDs:</h3>";
    
    // Get all active users
    $stmt = $conn->prepare("
        SELECT user_id, user_firstname, user_lastname, user_role 
        FROM tbl_users 
        WHERE user_status = 'Active' 
        LIMIT 5
    ");
    $stmt->execute();
    $activeUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($activeUsers as $user) {
        echo "<h4>Testing User ID: {$user['user_id']} ({$user['user_firstname']} {$user['user_lastname']})</h4>";
        
        $data = json_encode(['user_id' => $user['user_id']]);
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => $data
            ]
        ]);

        $url = 'http://localhost/capstone-project/backend/Users/get_user_details.php';
        $result = file_get_contents($url, false, $context);
        
        echo "<pre>";
        print_r(json_decode($result, true));
        echo "</pre>";
        echo "<hr>";
    }

} catch (PDOException $e) {
    echo "<h3>Database Error:</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?> 