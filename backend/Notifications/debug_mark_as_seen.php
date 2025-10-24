<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

echo "<h1>Debug: Mark All Notifications as Seen</h1>";

// Test with a specific user ID (you can change this)
$testUserId = 1; // Change this to your actual Super Admin user ID
$testUserRole = 'Super Admin';

echo "<h2>Testing with User ID: {$testUserId}, Role: {$testUserRole}</h2>";

// First, let's see what roles exist in the system
echo "<h3>🔍 Available Roles in System:</h3>";
$stmt = $conn->prepare("SELECT DISTINCT user_role, COUNT(*) as count FROM tbl_users GROUP BY user_role ORDER BY user_role");
$stmt->execute();
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($roles)) {
    echo "<p style='color: red;'>❌ No roles found in system!</p>";
} else {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Role ID</th><th>User Count</th></tr>";
    foreach ($roles as $role) {
        echo "<tr>";
        echo "<td>{$role['user_role']}</td>";
        echo "<td>{$role['count']}</td>";
        echo "</tr>";
    }
    echo "</table>";
}

// Let's also find users with role that might be Super Admin
echo "<h3>🔍 Users with Role ID 1 (likely Super Admin):</h3>";
$stmt = $conn->prepare("SELECT user_id, user_firstname, user_lastname, user_role FROM tbl_users WHERE user_role = 1 LIMIT 5");
$stmt->execute();
$superAdmins = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($superAdmins)) {
    echo "<p style='color: orange;'>⚠️ No users found with role ID 1</p>";
} else {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>User ID</th><th>Name</th><th>Role ID</th></tr>";
    foreach ($superAdmins as $admin) {
        echo "<tr>";
        echo "<td>{$admin['user_id']}</td>";
        echo "<td>{$admin['user_firstname']} {$admin['user_lastname']}</td>";
        echo "<td>{$admin['user_role']}</td>";
        echo "</tr>";
    }
    echo "</table>";
}

try {
    // 1. Check if user exists
    $stmt = $conn->prepare("SELECT user_id, user_firstname, user_middlename, user_lastname, user_role FROM tbl_users WHERE user_id = ?");
    $stmt->execute([$testUserId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "<p style='color: red;'>❌ User ID {$testUserId} not found!</p>";
        exit;
    }
    
    // Build full name from separate columns
    $fullName = trim($user['user_firstname'] . ' ' . ($user['user_middlename'] ? $user['user_middlename'] . ' ' : '') . $user['user_lastname']);
    
    echo "<p style='color: green;'>✅ User found: {$fullName} (Role ID: {$user['user_role']})</p>";
    
    // Also check what role this user ID actually has
    echo "<p>📋 User details: ID={$user['user_id']}, First={$user['user_firstname']}, Last={$user['user_lastname']}</p>";
    
    // 2. Check total notifications
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_notifications");
    $stmt->execute();
    $totalNotifications = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    echo "<p>📊 Total notifications in system: {$totalNotifications}</p>";
    
    // 3. Check unseen notifications for this user
    $stmt = $conn->prepare("
        SELECT COUNT(*) as unseen
        FROM tbl_notifications n
        LEFT JOIN tbl_notification_admin_views v
          ON v.notification_id = n.notification_id AND v.user_id = ?
        WHERE v.notification_id IS NULL
    ");
    $stmt->execute([$testUserId]);
    $unseenCount = $stmt->fetch(PDO::FETCH_ASSOC)['unseen'];
    echo "<p>👁️ Unseen notifications for user {$testUserId}: {$unseenCount}</p>";
    
    // 4. Check current admin views
    $stmt = $conn->prepare("SELECT COUNT(*) as seen FROM tbl_notification_admin_views WHERE user_id = ?");
    $stmt->execute([$testUserId]);
    $seenCount = $stmt->fetch(PDO::FETCH_ASSOC)['seen'];
    echo "<p>✅ Already seen notifications: {$seenCount}</p>";
    
    // 5. Show sample notifications
    echo "<h3>Sample Notifications:</h3>";
    $stmt = $conn->prepare("
        SELECT notification_id, notif_message, created_at, meeting_id
        FROM tbl_notifications 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($notifications)) {
        echo "<p style='color: orange;'>⚠️ No notifications found in tbl_notifications</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Message</th><th>Created</th><th>Meeting ID</th></tr>";
        foreach ($notifications as $notif) {
            echo "<tr>";
            echo "<td>{$notif['notification_id']}</td>";
            echo "<td>" . substr($notif['notif_message'], 0, 50) . "...</td>";
            echo "<td>{$notif['created_at']}</td>";
            echo "<td>" . ($notif['meeting_id'] ?? 'NULL') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // 6. Test the actual mark as seen functionality
    echo "<h3>Testing Mark as Seen:</h3>";
    
    if ($unseenCount > 0) {
        // Get unseen notification IDs
        $stmt = $conn->prepare("
            SELECT notification_id
            FROM tbl_notifications n
            LEFT JOIN tbl_notification_admin_views v
              ON v.notification_id = n.notification_id AND v.user_id = ?
            WHERE v.notification_id IS NULL
            LIMIT 3
        ");
        $stmt->execute([$testUserId]);
        $unseenIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "<p>Testing with first 3 unseen notifications: " . implode(', ', $unseenIds) . "</p>";
        
        $conn->beginTransaction();
        
        try {
            foreach ($unseenIds as $notificationId) {
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
            
            // Check updated counts
            $stmt = $conn->prepare("SELECT COUNT(*) as seen FROM tbl_notification_admin_views WHERE user_id = ?");
            $stmt->execute([$testUserId]);
            $newSeenCount = $stmt->fetch(PDO::FETCH_ASSOC)['seen'];
            echo "<p>✅ Updated seen count: {$newSeenCount}</p>";
            
        } catch (Exception $e) {
            $conn->rollBack();
            echo "<p style='color: red;'>❌ Error during transaction: " . $e->getMessage() . "</p>";
        }
        
    } else {
        echo "<p style='color: blue;'>ℹ️ No unseen notifications to test with</p>";
    }
    
    // 7. Show final state
    echo "<h3>Final State:</h3>";
    $stmt = $conn->prepare("
        SELECT COUNT(*) as unseen
        FROM tbl_notifications n
        LEFT JOIN tbl_notification_admin_views v
          ON v.notification_id = n.notification_id AND v.user_id = ?
        WHERE v.notification_id IS NULL
    ");
    $stmt->execute([$testUserId]);
    $finalUnseenCount = $stmt->fetch(PDO::FETCH_ASSOC)['unseen'];
    echo "<p>👁️ Final unseen count: {$finalUnseenCount}</p>";
    
    $stmt = $conn->prepare("SELECT COUNT(*) as seen FROM tbl_notification_admin_views WHERE user_id = ?");
    $stmt->execute([$testUserId]);
    $finalSeenCount = $stmt->fetch(PDO::FETCH_ASSOC)['seen'];
    echo "<p>✅ Final seen count: {$finalSeenCount}</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h3>Manual SQL Commands to Test:</h3>";
echo "<pre>";
echo "-- Check if table exists\n";
echo "SHOW TABLES LIKE 'tbl_notification_admin_views';\n\n";

echo "-- Check table structure\n";
echo "DESCRIBE tbl_notification_admin_views;\n\n";

echo "-- Check current data\n";
echo "SELECT * FROM tbl_notification_admin_views;\n\n";

echo "-- Check notifications\n";
echo "SELECT COUNT(*) FROM tbl_notifications;\n\n";

echo "-- Check unseen for user {$testUserId}\n";
echo "SELECT COUNT(*) FROM tbl_notifications n\n";
echo "LEFT JOIN tbl_notification_admin_views v\n";
echo "  ON v.notification_id = n.notification_id AND v.user_id = {$testUserId}\n";
echo "WHERE v.notification_id IS NULL;\n\n";

echo "-- Check role mapping (if exists)\n";
echo "SHOW TABLES LIKE '%role%';\n\n";

echo "-- Check user details for specific ID\n";
echo "SELECT user_id, user_firstname, user_lastname, user_role FROM tbl_users WHERE user_id = {$testUserId};\n";
echo "</pre>";
?>
