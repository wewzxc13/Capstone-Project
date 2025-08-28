<?php
// Test file for teacher notifications
// This file tests the new notification read logic for teachers

require_once '../connection.php';

echo "<h1>Teacher Notification System Test</h1>";

// Test 1: Check if the required columns exist
echo "<h2>Test 1: Database Schema Check</h2>";

try {
    // Check tbl_notification_recipients
    $stmt = $conn->prepare("DESCRIBE tbl_notification_recipients");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>tbl_notification_recipients columns:</h3>";
    echo "<ul>";
    foreach ($columns as $column) {
        echo "<li>$column</li>";
    }
    echo "</ul>";
    
    // Check tbl_meetings
    $stmt = $conn->prepare("DESCRIBE tbl_meetings");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>tbl_meetings columns:</h3>";
    echo "<ul>";
    foreach ($columns as $column) {
        echo "<li>$column</li>";
    }
    echo "</ul>";
    
    // Check tbl_progress_notification
    $stmt = $conn->prepare("DESCRIBE tbl_progress_notification");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>tbl_progress_notification columns:</h3>";
    echo "<ul>";
    foreach ($columns as $column) {
        echo "<li>$column</li>";
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error checking schema: " . $e->getMessage() . "</p>";
}

// Test 2: Check sample data
echo "<h2>Test 2: Sample Data Check</h2>";

try {
    // Check notifications
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_notifications");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total notifications: " . $result['count'] . "</p>";
    
    // Check notification recipients
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_notification_recipients");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total notification recipients: " . $result['count'] . "</p>";
    
    // Check meetings
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_meetings");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total meetings: " . $result['count'] . "</p>";
    
    // Check progress notifications
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_progress_notification");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total progress notifications: " . $result['count'] . "</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error checking data: " . $e->getMessage() . "</p>";
}

// Test 3: Test teacher notification queries
echo "<h2>Test 3: Teacher Notification Queries</h2>";

try {
    // Test general meeting notifications query
    echo "<h3>General Meeting Notifications Query:</h3>";
    $sql = "
        SELECT 
            n.notification_id,
            n.notif_message,
            nr.user_id,
            nr.is_read,
            nr.read_at
        FROM tbl_notifications n
        INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
        INNER JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
        WHERE nr.recipient_type = 'Teacher'
        AND m.parent_id IS NULL 
        AND m.student_id IS NULL 
        AND m.advisory_id IS NULL
        LIMIT 5
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($results)) {
        echo "<p>No general meeting notifications found for teachers.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Notification ID</th><th>Message</th><th>User ID</th><th>Is Read</th><th>Read At</th></tr>";
        foreach ($results as $row) {
            echo "<tr>";
            echo "<td>" . $row['notification_id'] . "</td>";
            echo "<td>" . htmlspecialchars($row['notif_message']) . "</td>";
            echo "<td>" . $row['user_id'] . "</td>";
            echo "<td>" . ($row['is_read'] ? 'Yes' : 'No') . "</td>";
            echo "<td>" . ($row['read_at'] ?? 'Never') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error testing queries: " . $e->getMessage() . "</p>";
}

echo "<h2>Test Complete</h2>";
echo "<p>If you see this message, the basic database connection and queries are working.</p>";
echo "<p>Check the results above to verify the schema changes are in place.</p>";
?>
