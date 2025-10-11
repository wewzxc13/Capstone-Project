<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

echo "<h1>🔍 Role Mapping Investigation</h1>";

try {
    // 1. Check what tables exist that might contain role information
    echo "<h2>📋 Tables in Database:</h2>";
    $stmt = $conn->prepare("SHOW TABLES");
    $stmt->execute();
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>{$table}</li>";
    }
    echo "</ul>";
    
    // 2. Check if there's a roles table
    echo "<h2>🎭 Looking for Role Tables:</h2>";
    $roleTables = array_filter($tables, function($table) {
        return stripos($table, 'role') !== false;
    });
    
    if (empty($roleTables)) {
        echo "<p style='color: orange;'>⚠️ No tables with 'role' in the name found</p>";
    } else {
        echo "<p style='color: green;'>✅ Found role-related tables:</p>";
        echo "<ul>";
        foreach ($roleTables as $table) {
            echo "<li>{$table}</li>";
        }
        echo "</ul>";
        
        // Check structure of role tables
        foreach ($roleTables as $table) {
            echo "<h3>📊 Structure of {$table}:</h3>";
            $stmt = $conn->prepare("DESCRIBE {$table}");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>Column</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
            foreach ($columns as $col) {
                echo "<tr>";
                echo "<td>{$col['Field']}</td>";
                echo "<td>{$col['Type']}</td>";
                echo "<td>{$col['Null']}</td>";
                echo "<td>{$col['Key']}</td>";
                echo "<td>{$col['Default']}</td>";
                echo "<td>{$col['Extra']}</td>";
                echo "</tr>";
            }
            echo "</table>";
            
            // Show sample data
            $stmt = $conn->prepare("SELECT * FROM {$table} LIMIT 5");
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($data)) {
                echo "<h4>Sample Data from {$table}:</h4>";
                echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
                $headers = array_keys($data[0]);
                echo "<tr>";
                foreach ($headers as $header) {
                    echo "<th>{$header}</th>";
                }
                echo "</tr>";
                
                foreach ($data as $row) {
                    echo "<tr>";
                    foreach ($row as $value) {
                        echo "<td>" . htmlspecialchars($value ?? 'NULL') . "</td>";
                    }
                    echo "</tr>";
                }
                echo "</table>";
            }
        }
    }
    
    // 3. Check current user roles in tbl_users
    echo "<h2>👥 Current User Roles in tbl_users:</h2>";
    $stmt = $conn->prepare("SELECT user_role, COUNT(*) as count FROM tbl_users GROUP BY user_role ORDER BY user_role");
    $stmt->execute();
    $userRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($userRoles)) {
        echo "<p style='color: red;'>❌ No users found!</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Role ID</th><th>User Count</th></tr>";
        foreach ($userRoles as $role) {
            echo "<tr>";
            echo "<td>{$role['user_role']}</td>";
            echo "<td>{$role['count']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Show sample users for each role
        foreach ($userRoles as $role) {
            $roleId = $role['user_role'];
            echo "<h3>👤 Sample Users with Role ID {$roleId}:</h3>";
            
            $stmt = $conn->prepare("SELECT user_id, user_firstname, user_lastname, user_role FROM tbl_users WHERE user_role = ? LIMIT 3");
            $stmt->execute([$roleId]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($users)) {
                echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
                echo "<tr><th>User ID</th><th>Name</th><th>Role ID</th></tr>";
                foreach ($users as $user) {
                    echo "<tr>";
                    echo "<td>{$user['user_id']}</td>";
                    echo "<td>{$user['user_firstname']} {$user['user_lastname']}</td>";
                    echo "<td>{$user['user_role']}</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
        }
    }
    
    // 4. Check if there's a role mapping in the frontend
    echo "<h2>🔗 Frontend Role Mapping:</h2>";
    echo "<p>Based on the frontend code, these string roles are expected:</p>";
    echo "<ul>";
    echo "<li><code>\"Admin\"</code></li>";
    echo "<li><code>\"SuperAdmin\"</code></li>";
    echo "<li><code>\"Super Admin\"</code></li>";
    echo "<li><code>\"Teacher\"</code></li>";
    echo "<li><code>\"Parent\"</code></li>";
    echo "</ul>";
    
    echo "<p>But the database uses numeric role IDs. We need to create a mapping!</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h2>💡 Solution Options:</h2>";
echo "<ol>";
echo "<li><strong>Create a role mapping table</strong> to translate between numeric IDs and string names</li>";
echo "<li><strong>Update the frontend</strong> to use numeric role IDs instead of strings</li>";
echo "<li><strong>Update the backend</strong> to handle both numeric and string role checks</li>";
echo "</ol>";

echo "<h3>🚀 Recommended Approach:</h3>";
echo "<p>Create a simple role mapping table and update the backend to handle both formats.</p>";
echo "<pre>";
echo "-- Create role mapping table\n";
echo "CREATE TABLE IF NOT EXISTS tbl_role_mapping (\n";
echo "  role_id INT PRIMARY KEY,\n";
echo "  role_name VARCHAR(50) NOT NULL,\n";
echo "  role_display_name VARCHAR(100) NOT NULL\n";
echo ");\n\n";
echo "-- Insert common roles\n";
echo "INSERT INTO tbl_role_mapping (role_id, role_name, role_display_name) VALUES\n";
echo "  (1, 'SuperAdmin', 'Super Admin'),\n";
echo "  (2, 'Admin', 'Admin'),\n";
echo "  (3, 'Teacher', 'Teacher'),\n";
echo "  (4, 'Parent', 'Parent');\n";
echo "</pre>";
?>
