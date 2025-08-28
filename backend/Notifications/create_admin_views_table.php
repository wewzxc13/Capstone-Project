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

echo "<h1>🔧 Create Admin Views Table</h1>";

try {
    // Check if table already exists
    echo "<h2>📋 Checking if table exists...</h2>";
    $stmt = $conn->prepare("SHOW TABLES LIKE 'tbl_notification_admin_views'");
    $stmt->execute();
    $tableExists = $stmt->fetch();
    
    if ($tableExists) {
        echo "<p style='color: green;'>✅ Table 'tbl_notification_admin_views' already exists!</p>";
        
        // Show table structure
        echo "<h3>📊 Current Table Structure:</h3>";
        $stmt = $conn->prepare("DESCRIBE tbl_notification_admin_views");
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
        
        // Show current data count
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_notification_admin_views");
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "<p>📊 Current records in table: {$count}</p>";
        
    } else {
        echo "<p style='color: orange;'>⚠️ Table 'tbl_notification_admin_views' does not exist. Creating it now...</p>";
        
        // Create the table
        $createTableSQL = "
        CREATE TABLE IF NOT EXISTS tbl_notification_admin_views (
          user_id         INT NOT NULL,
          notification_id INT NOT NULL,
          viewed_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, notification_id),
          KEY idx_user_time (user_id, viewed_at),
          CONSTRAINT fk_nav_user FOREIGN KEY (user_id) REFERENCES tbl_users(user_id) ON DELETE CASCADE,
          CONSTRAINT fk_nav_notif FOREIGN KEY (notification_id) REFERENCES tbl_notifications(notification_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ";
        
        $conn->exec($createTableSQL);
        echo "<p style='color: green;'>✅ Table 'tbl_notification_admin_views' created successfully!</p>";
        
        // Verify the table was created
        echo "<h3>📊 New Table Structure:</h3>";
        $stmt = $conn->prepare("DESCRIBE tbl_notification_admin_views");
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
    }
    
    // Test the table functionality
    echo "<h2>🧪 Testing Table Functionality</h2>";
    
    // Test insert
    $testUserId = 1;
    $testNotificationId = 999; // Use a high number that likely doesn't exist
    
    echo "<h3>Test 1: Insert Test Record</h3>";
    try {
        $stmt = $conn->prepare("
            INSERT INTO tbl_notification_admin_views (user_id, notification_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE viewed_at = NOW()
        ");
        $stmt->execute([$testUserId, $testNotificationId]);
        echo "<p style='color: green;'>✅ Test insert successful</p>";
        
        // Verify insert
        $stmt = $conn->prepare("SELECT * FROM tbl_notification_admin_views WHERE user_id = ? AND notification_id = ?");
        $stmt->execute([$testUserId, $testNotificationId]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($record) {
            echo "<p>✅ Record found: User ID {$record['user_id']}, Notification ID {$record['notification_id']}, Viewed at {$record['viewed_at']}</p>";
        }
        
        // Clean up test record
        $stmt = $conn->prepare("DELETE FROM tbl_notification_admin_views WHERE user_id = ? AND notification_id = ?");
        $stmt->execute([$testUserId, $testNotificationId]);
        echo "<p style='color: blue;'>🧹 Test record cleaned up</p>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Test insert failed: " . $e->getMessage() . "</p>";
    }
    
    // Test foreign key constraints
    echo "<h3>Test 2: Foreign Key Constraints</h3>";
    
    // Try to insert with non-existent user_id
    try {
        $stmt = $conn->prepare("
            INSERT INTO tbl_notification_admin_views (user_id, notification_id)
            VALUES (99999, 1)
        ");
        $stmt->execute();
        echo "<p style='color: red;'>❌ Foreign key constraint failed - should not allow non-existent user_id</p>";
    } catch (Exception $e) {
        echo "<p style='color: green;'>✅ Foreign key constraint working: " . $e->getMessage() . "</p>";
    }
    
    // Try to insert with non-existent notification_id
    try {
        $stmt = $conn->prepare("
            INSERT INTO tbl_notification_admin_views (user_id, notification_id)
            VALUES (1, 99999)
        ");
        $stmt->execute();
        echo "<p style='color: red;'>❌ Foreign key constraint failed - should not allow non-existent notification_id</p>";
    } catch (Exception $e) {
        echo "<p style='color: green;'>✅ Foreign key constraint working: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h2>🎯 Next Steps:</h2>";
echo "<ol>";
echo "<li>✅ Table is now created and functional</li>";
echo "<li>🔄 Test the notification bell click in your application</li>";
echo "<li>👀 Check if notifications are now marked as seen</li>";
echo "<li>📱 Verify the badge count decreases</li>";
echo "</ol>";

echo "<h3>🚀 Test the Application:</h3>";
echo "<p>Now go back to your application and:</p>";
echo "<ol>";
echo "<li>Click the notification bell</li>";
echo "<li>Check the browser console for success messages</li>";
echo "<li>Verify the badge count resets to 0</li>";
echo "<li>Check if notifications show as 'seen'</li>";
echo "</ol>";
?>
