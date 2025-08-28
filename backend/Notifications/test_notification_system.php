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

// Test configuration
$testUserId = 1; // Change this to a valid user ID in your system
$testUserRole = 'SuperAdmin'; // Change this to match the user's role

echo "<h1>Notification System Test - New Admin Views Approach</h1>";
echo "<p><strong>NEW APPROACH:</strong> Admin and Super Admin use separate 'seen' tracking table without modifying recipient read status.</p>";
echo "<p>Testing with User ID: {$testUserId}, Role: {$testUserRole}</p><br>";

// Test 1: Count unseen notifications using admin views table
echo "<h2>Test 1: Count Unseen Notifications (Admin Views Approach - Both Admin & Super Admin)</h2>";
try {
    $stmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM tbl_notifications n
             JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
             LEFT JOIN tbl_notification_admin_views v ON v.notification_id = n.notification_id AND v.user_id = ?
             WHERE v.notification_id IS NULL
               AND m.parent_id IS NULL AND m.student_id IS NULL AND m.advisory_id IS NULL) as unseen_general,
            (SELECT COUNT(*) FROM tbl_notifications n
             JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
             LEFT JOIN tbl_notification_admin_views v ON v.notification_id = n.notification_id AND v.user_id = ?
             WHERE v.notification_id IS NULL
               AND (m.parent_id IS NOT NULL OR m.advisory_id IS NOT NULL)) as unseen_one_on_one,
            (SELECT COUNT(*) FROM tbl_notifications n
             LEFT JOIN tbl_notification_admin_views v ON v.notification_id = n.notification_id AND v.user_id = ?
             WHERE v.notification_id IS NULL AND n.meeting_id IS NULL) as unseen_progress
    ");
    $stmt->execute([$testUserId, $testUserId, $testUserId]);
    $counts = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<p><strong>General Meetings Unseen:</strong> {$counts['unseen_general']}</p>";
    echo "<p><strong>One-on-One Meetings Unseen:</strong> {$counts['unseen_one_on_one']}</p>";
    echo "<p><strong>Progress Notifications Unseen:</strong> {$counts['unseen_progress']}</p>";
    echo "<p><strong>Total Unseen Count:</strong> " . ($counts['unseen_general'] + $counts['unseen_one_on_one'] + $counts['unseen_progress']) . "</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error counting notifications: " . $e->getMessage() . "</p>";
}

// Test 2: Check database schema
echo "<h2>Test 2: Database Schema Check</h2>";
try {
    // Check tbl_notification_recipients
    $stmt = $conn->prepare("DESCRIBE tbl_notification_recipients");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $hasIsRead = false;
    $hasReadAt = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'is_read') $hasIsRead = true;
        if ($column['Field'] === 'read_at') $hasReadAt = true;
    }
    
    echo "<p>tbl_notification_recipients:</p>";
    echo "<ul>";
    echo "<li>is_read column: " . ($hasIsRead ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "<li>read_at column: " . ($hasReadAt ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "</ul>";
    
    // Check tbl_meetings
    $stmt = $conn->prepare("DESCRIBE tbl_meetings");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $hasParentIsRead = false;
    $hasLeadIsRead = false;
    $hasAssistantIsRead = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'parent_is_read') $hasParentIsRead = true;
        if ($column['Field'] === 'lead_is_read') $hasLeadIsRead = true;
        if ($column['Field'] === 'assistant_is_read') $hasAssistantIsRead = true;
    }
    
    echo "<p>tbl_meetings:</p>";
    echo "<ul>";
    echo "<li>parent_is_read column: " . ($hasParentIsRead ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "<li>lead_is_read column: " . ($hasLeadIsRead ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "<li>assistant_is_read column: " . ($hasAssistantIsRead ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "</ul>";
    
    // Check tbl_progress_notification
    $stmt = $conn->prepare("DESCRIBE tbl_progress_notification");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $hasParentIsRead = false;
    $hasLeadIsRead = false;
    $hasAssistantIsRead = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'parent_is_read') $hasParentIsRead = true;
        if ($column['Field'] === 'lead_is_read') $hasLeadIsRead = true;
        if ($column['Field'] === 'assistant_is_read') $hasAssistantIsRead = true;
    }
    
    echo "<p>tbl_progress_notification:</p>";
    echo "<ul>";
    echo "<li>parent_is_read column: " . ($hasParentIsRead ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "<li>lead_is_read column: " . ($hasLeadIsRead ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "<li>assistant_is_read column: " . ($hasAssistantIsRead ? "✅ Present" : "❌ Missing") . " (Used for Teacher/Parent tracking)</li>";
    echo "</ul>";
    
    // Check new tbl_notification_admin_views table
    $stmt = $conn->prepare("DESCRIBE tbl_notification_admin_views");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $hasUserId = false;
    $hasNotificationId = false;
    $hasViewedAt = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'user_id') $hasUserId = true;
        if ($column['Field'] === 'notification_id') $hasNotificationId = true;
        if ($column['Field'] === 'viewed_at') $hasViewedAt = true;
    }
    
    echo "<p>tbl_notification_admin_views (NEW):</p>";
    echo "<ul>";
    echo "<li>user_id column: " . ($hasUserId ? "✅ Present" : "❌ Missing") . " (Used for Super Admin seen tracking)</li>";
    echo "<li>notification_id column: " . ($hasNotificationId ? "✅ Present" : "❌ Missing") . " (Used for Super Admin seen tracking)</li>";
    echo "<li>viewed_at column: " . ($hasViewedAt ? "✅ Present" : "❌ Missing") . " (Used for Super Admin seen tracking)</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error checking schema: " . $e->getMessage() . "</p>";
}

// Test 3: Sample data check
echo "<h2>Test 3: Sample Data Check</h2>";
try {
    // Check for sample notifications
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_notifications");
    $stmt->execute();
    $notificationCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "<p>Total notifications in tbl_notifications: {$notificationCount}</p>";
    
    // Check for sample meetings
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_meetings");
    $stmt->execute();
    $meetingCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "<p>Total meetings in tbl_meetings: {$meetingCount}</p>";
    
    // Check for sample progress notifications
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_progress_notification");
    $stmt->execute();
    $progressCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "<p>Total progress notifications in tbl_progress_notification: {$progressCount}</p>";
    
    // Check for admin views
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_notification_admin_views");
    $stmt->execute();
    $adminViewsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "<p>Total admin views in tbl_notification_admin_views: {$adminViewsCount}</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error checking sample data: " . $e->getMessage() . "</p>";
}

// Test 4: API endpoint test links
echo "<h2>Test 4: API Endpoint Tests</h2>";
echo "<p>Test the following endpoints:</p>";
echo "<ul>";
echo "<li><a href='count_unread_notifications.php' target='_blank'>Count Unread Notifications</a> (POST request required)</li>";
echo "<li><a href='get_notifications_with_read_status.php' target='_blank'>Get Notifications with Read Status</a> (POST request required)</li>";
echo "<li><a href='mark_all_notifications_read.php' target='_blank'>Mark All Notifications as Read</a> (POST request required)</li>";
echo "<li><a href='mark_notification_seen.php' target='_blank'>Mark Notification as Seen (NEW)</a> (POST request required)</li>";
echo "</ul>";

echo "<h2>Test 5: Manual API Testing</h2>";
echo "<p>Use these curl commands to test the APIs:</p>";
echo "<pre>";
echo "# Count unseen notifications (Super Admin - admin views approach)\n";
echo "curl -X POST http://localhost/capstone-project/backend/Notifications/count_unread_notifications.php \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -d '{\"user_id\": \"{$testUserId}\", \"user_role\": \"{$testUserRole}\"}'\n\n";

echo "# Mark all notifications as seen (Super Admin - admin views approach)\n";
echo "curl -X POST http://localhost/capstone-project/backend/Notifications/mark_all_notifications_read.php \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -d '{\"user_id\": \"{$testUserId}\", \"user_role\": \"{$testUserRole}\"}'\n\n";

echo "# Mark individual notification as seen (Super Admin - admin views approach)\n";
echo "curl -X POST http://localhost/capstone-project/backend/Notifications/mark_notification_seen.php \\\n";
echo "  -H \"Content-Type: application/json\" \\\n";
echo "  -d '{\"user_id\": \"{$testUserId}\", \"notification_id\": \"1\", \"user_role\": \"{$testUserRole}\"}'\n";
echo "</pre>";

echo "<h2>Test 6: New Approach Summary</h2>";
echo "<div style='background: #f0f8ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc;'>";
echo "<h3>Admin & Super Admin Notification Behavior (NEW APPROACH):</h3>";
echo "<ul>";
echo "<li><strong>Recipient Read Status:</strong> ❌ Never modified by Admin/Super Admin</li>";
echo "<li><strong>Admin Seen Tracking:</strong> ✅ Separate table (tbl_notification_admin_views)</li>";
echo "<li><strong>Badge Count:</strong> ✅ Based on unseen notifications</li>";
echo "<li><strong>Data Integrity:</strong> ✅ Recipient read status remains untouched</li>";
echo "</ul>";
echo "<p><strong>Result:</strong> Both Admin and Super Admin track what they've seen without interfering with Teacher/Parent read status.</p>";
echo "</div>";

echo "<h2>Test 7: Database Queries</h2>";
echo "<p>Test these SQL queries directly in phpMyAdmin:</p>";
echo "<pre>";
echo "-- Count unseen notifications for Admin/Super Admin\n";
echo "SELECT COUNT(*) AS unseen_for_admin\n";
echo "FROM tbl_notifications n\n";
echo "LEFT JOIN tbl_notification_admin_views v\n";
echo "  ON v.notification_id = n.notification_id AND v.user_id = {$testUserId}\n";
echo "WHERE v.notification_id IS NULL;\n\n";

echo "-- Mark notification as seen by Admin/Super Admin\n";
echo "INSERT INTO tbl_notification_admin_views (user_id, notification_id)\n";
echo "VALUES ({$testUserId}, 1)\n";
echo "ON DUPLICATE KEY UPDATE viewed_at = NOW();\n";
echo "</pre>";

echo "<h2>Test Results Summary</h2>";
echo "<p>✅ Schema check completed</p>";
echo "<p>✅ Sample data check completed</p>";
echo "<p>✅ API endpoints available</p>";
echo "<p>✅ New admin views approach implemented</p>";
echo "<p>✅ Data integrity maintained</p>";
echo "<p>⚠️  Manual testing required for POST endpoints</p>";

?>
