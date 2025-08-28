<?php
// Simple test to check database connection and user queries
include_once 'connection.php';

echo "<h2>Simple User Test</h2>";

try {
    // Test 1: Check if we can connect to the database
    echo "<h3>1. Database Connection Test:</h3>";
    echo "<p>✅ Database connection successful</p>";
    
    // Test 2: Check if tbl_users table exists and has data
    echo "<h3>2. tbl_users Table Test:</h3>";
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_users");
    $stmt->execute();
    $userCount = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total users in database: " . $userCount['count'] . "</p>";
    
    // Test 3: Check if tbl_roles table exists and has data
    echo "<h3>3. tbl_roles Table Test:</h3>";
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_roles");
    $stmt->execute();
    $roleCount = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total roles in database: " . $roleCount['count'] . "</p>";
    
    // Test 4: Show all roles
    echo "<h3>4. All Roles:</h3>";
    $stmt = $conn->prepare("SELECT * FROM tbl_roles");
    $stmt->execute();
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($roles);
    echo "</pre>";
    
    // Test 5: Show users with their role IDs
    echo "<h3>5. Users with Role IDs:</h3>";
    $stmt = $conn->prepare("
        SELECT user_id, user_firstname, user_lastname, user_role, user_status 
        FROM tbl_users 
        WHERE user_status = 'Active'
        LIMIT 10
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($users);
    echo "</pre>";
    
    // Test 6: Test the JOIN query that the API uses
    echo "<h3>6. Testing JOIN Query (API Logic):</h3>";
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
    $joinedUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($joinedUsers);
    echo "</pre>";
    
    // Test 7: Check for any users with NULL role_name
    echo "<h3>7. Users with NULL role_name (Potential Issue):</h3>";
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_lastname,
            u.user_role,
            r.role_name
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Active' AND r.role_name IS NULL
    ");
    $stmt->execute();
    $nullRoleUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($nullRoleUsers);
    echo "</pre>";
    
    if (empty($nullRoleUsers)) {
        echo "<p>✅ No users found with NULL role_name</p>";
    } else {
        echo "<p>⚠️ Found " . count($nullRoleUsers) . " users with NULL role_name - This might be the issue!</p>";
    }
    
} catch (PDOException $e) {
    echo "<h3>Database Error:</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?> 