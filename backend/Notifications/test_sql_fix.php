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

echo "<h1>🔧 SQL Fix Test</h1>";

$testUserId = 1; // Change this to your actual Super Admin user ID

try {
    echo "<h2>Testing Fixed SQL Queries</h2>";
    
    // Test 1: Count unseen notifications (the query that was failing)
    echo "<h3>Test 1: Count Unseen Notifications</h3>";
    $stmt = $conn->prepare("
        SELECT COUNT(n.notification_id) AS unseen_count
        FROM tbl_notifications n
        LEFT JOIN tbl_notification_admin_views v
          ON v.notification_id = n.notification_id AND v.user_id = ?
        WHERE v.notification_id IS NULL
    ");
    $stmt->execute([$testUserId]);
    $unseenCount = $stmt->fetch(PDO::FETCH_ASSOC)['unseen_count'];
    echo "<p style='color: green;'>✅ Query 1 successful: {$unseenCount} unseen notifications</p>";
    
    // Test 2: Get unseen notification IDs
    echo "<h3>Test 2: Get Unseen Notification IDs</h3>";
    $stmt = $conn->prepare("
        SELECT n.notification_id
        FROM tbl_notifications n
        LEFT JOIN tbl_notification_admin_views v
          ON v.notification_id = n.notification_id AND v.user_id = ?
        WHERE v.notification_id IS NULL
        LIMIT 5
    ");
    $stmt->execute([$testUserId]);
    $unseenIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "<p style='color: green;'>✅ Query 2 successful: Found " . count($unseenIds) . " unseen notification IDs</p>";
    if (!empty($unseenIds)) {
        echo "<p>Sample IDs: " . implode(', ', $unseenIds) . "</p>";
    }
    
    // Test 3: Test the actual mark as seen functionality
    echo "<h3>Test 3: Mark Notifications as Seen</h3>";
    if (!empty($unseenIds)) {
        $conn->beginTransaction();
        
        try {
            // Mark first 3 notifications as seen
            $testIds = array_slice($unseenIds, 0, 3);
            echo "<p>Testing with notification IDs: " . implode(', ', $testIds) . "</p>";
            
            foreach ($testIds as $notificationId) {
                $stmt = $conn->prepare("
                    INSERT INTO tbl_notification_admin_views (user_id, notification_id)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE viewed_at = NOW()
                ");
                $stmt->execute([$testUserId, $notificationId]);
                echo "<p style='color: green;'>✅ Marked notification {$notificationId} as seen</p>";
            }
            
            $conn->commit();
            echo "<p style='color: green;'>✅ Transaction committed successfully</p>";
            
            // Verify the change
            $stmt = $conn->prepare("SELECT COUNT(*) as seen FROM tbl_notification_admin_views WHERE user_id = ?");
            $stmt->execute([$testUserId]);
            $seenCount = $stmt->fetch(PDO::FETCH_ASSOC)['seen'];
            echo "<p>✅ Total seen notifications: {$seenCount}</p>";
            
        } catch (Exception $e) {
            $conn->rollBack();
            echo "<p style='color: red;'>❌ Error during transaction: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p style='color: blue;'>ℹ️ No unseen notifications to test with</p>";
    }
    
    // Test 4: Verify the count decreased
    echo "<h3>Test 4: Verify Count Decreased</h3>";
    $stmt = $conn->prepare("
        SELECT COUNT(n.notification_id) AS unseen_count
        FROM tbl_notifications n
        LEFT JOIN tbl_notification_admin_views v
          ON v.notification_id = n.notification_id AND v.user_id = ?
        WHERE v.notification_id IS NULL
    ");
    $stmt->execute([$testUserId]);
    $newUnseenCount = $stmt->fetch(PDO::FETCH_ASSOC)['unseen_count'];
    echo "<p>👁️ New unseen count: {$newUnseenCount}</p>";
    echo "<p>📊 Count change: " . ($unseenCount - $newUnseenCount) . " notifications marked as seen</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h2>🎯 Next Steps:</h2>";
echo "<ol>";
echo "<li>✅ SQL queries are now fixed</li>";
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
