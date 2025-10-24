<?php
// Debug script to check conversations for a specific user
include_once 'backend/connection.php';

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 23; // Default to user 23 (Parent)

echo "<h2>Debug Conversations for User ID: $userId</h2>";

// Get all conversations for this user
$stmt = $conn->prepare("
    SELECT 
        c.message_id,
        c.sender_id,
        c.receiver_id,
        c.message_text,
        c.sent_at,
        c.is_archived,
        sender.user_firstname as sender_firstname,
        sender.user_lastname as sender_lastname,
        receiver.user_firstname as receiver_firstname,
        receiver.user_lastname as receiver_lastname
    FROM tbl_communication c
    LEFT JOIN tbl_users sender ON sender.user_id = c.sender_id
    LEFT JOIN tbl_users receiver ON receiver.user_id = c.receiver_id
    WHERE (c.sender_id = :user_id OR c.receiver_id = :user_id)
    ORDER BY c.sent_at DESC
    LIMIT 50
");

$stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
$stmt->execute();
$conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h3>All Conversations (Last 50):</h3>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Message ID</th><th>Sender</th><th>Receiver</th><th>Message</th><th>Sent At</th><th>Archived</th></tr>";

foreach ($conversations as $conv) {
    $senderName = trim($conv['sender_firstname'] . ' ' . $conv['sender_lastname']);
    $receiverName = trim($conv['receiver_firstname'] . ' ' . $conv['receiver_lastname']);
    $archived = $conv['is_archived'] ? 'Yes' : 'No';
    
    echo "<tr>";
    echo "<td>{$conv['message_id']}</td>";
    echo "<td>{$senderName} (ID: {$conv['sender_id']})</td>";
    echo "<td>{$receiverName} (ID: {$conv['receiver_id']})</td>";
    echo "<td>" . htmlspecialchars(substr($conv['message_text'], 0, 50)) . "...</td>";
    echo "<td>{$conv['sent_at']}</td>";
    echo "<td>{$archived}</td>";
    echo "</tr>";
}

echo "</table>";

// Get unique conversation partners
$stmt2 = $conn->prepare("
    SELECT DISTINCT
        CASE 
            WHEN c.sender_id = :user_id THEN c.receiver_id 
            ELSE c.sender_id 
        END AS conversation_partner_id,
        CASE 
            WHEN c.sender_id = :user_id THEN CONCAT(receiver.user_firstname, ' ', receiver.user_lastname)
            ELSE CONCAT(sender.user_firstname, ' ', sender.user_lastname)
        END AS partner_name,
        COUNT(*) as message_count,
        MAX(c.sent_at) as last_message_at
    FROM tbl_communication c
    LEFT JOIN tbl_users sender ON sender.user_id = c.sender_id
    LEFT JOIN tbl_users receiver ON receiver.user_id = c.receiver_id
    WHERE (c.sender_id = :user_id OR c.receiver_id = :user_id)
        AND c.is_archived = 0
    GROUP BY conversation_partner_id, partner_name
    ORDER BY last_message_at DESC
");

$stmt2->bindValue(':user_id', $userId, PDO::PARAM_INT);
$stmt2->execute();
$partners = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo "<h3>Conversation Partners (Non-Archived):</h3>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Partner ID</th><th>Partner Name</th><th>Message Count</th><th>Last Message</th></tr>";

foreach ($partners as $partner) {
    echo "<tr>";
    echo "<td>{$partner['conversation_partner_id']}</td>";
    echo "<td>{$partner['partner_name']}</td>";
    echo "<td>{$partner['message_count']}</td>";
    echo "<td>{$partner['last_message_at']}</td>";
    echo "</tr>";
}

echo "</table>";

// Test the get_users.php query
echo "<h3>Testing get_users.php Query:</h3>";
$stmt3 = $conn->prepare("
    SELECT DISTINCT
        u.user_id,
        u.user_firstname,
        u.user_middlename,
        u.user_lastname,
        u.user_role,
        ls.last_sent_at,
        ls.last_message,
        COALESCE(unread.unread_count, 0) as unread_count
    FROM tbl_users u
    LEFT JOIN (
        SELECT 
            conversation_partner_id,
            last_sent_at,
            last_message,
            is_last_unsent
        FROM (
            SELECT 
                CASE 
                    WHEN c.sender_id = :user_id THEN c.receiver_id 
                    ELSE c.sender_id 
                END AS conversation_partner_id,
                c.sent_at AS last_sent_at,
                c.message_text as last_message,
                c.is_unsent as is_last_unsent,
                ROW_NUMBER() OVER (
                    PARTITION BY CASE 
                        WHEN c.sender_id = :user_id THEN c.receiver_id 
                        ELSE c.sender_id 
                    END 
                    ORDER BY c.sent_at DESC
                ) as rn
            FROM tbl_communication c
            WHERE (c.sender_id = :user_id OR c.receiver_id = :user_id)
                AND c.is_archived = 0
        ) ranked
        WHERE rn = 1
    ) ls ON ls.conversation_partner_id = u.user_id
    LEFT JOIN (
        SELECT 
            CASE 
                WHEN c.sender_id = :user_id THEN c.receiver_id 
                ELSE c.sender_id 
            END AS conversation_partner_id,
            COUNT(CASE WHEN c.is_read = 0 AND c.sender_id != :user_id THEN 1 END) as unread_count
        FROM tbl_communication c
        WHERE (c.sender_id = :user_id OR c.receiver_id = :user_id)
            AND c.is_archived = 0
        GROUP BY CASE 
            WHEN c.sender_id = :user_id THEN c.receiver_id 
            ELSE c.sender_id 
        END
    ) unread ON unread.conversation_partner_id = u.user_id
    WHERE u.user_role IN (1,2,3,4) 
        AND TRIM(LOWER(u.user_status)) = 'active'
        AND u.user_id != :user_id
        AND ls.conversation_partner_id IS NOT NULL
    ORDER BY ls.last_sent_at DESC, u.user_lastname ASC, u.user_firstname ASC
");

$stmt3->bindValue(':user_id', $userId, PDO::PARAM_INT);
$stmt3->execute();
$users = $stmt3->fetchAll(PDO::FETCH_ASSOC);

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>User ID</th><th>Name</th><th>Role</th><th>Last Message</th><th>Unread Count</th></tr>";

foreach ($users as $user) {
    $fullName = trim($user['user_firstname'] . ' ' . $user['user_middlename'] . ' ' . $user['user_lastname']);
    echo "<tr>";
    echo "<td>{$user['user_id']}</td>";
    echo "<td>{$fullName}</td>";
    echo "<td>{$user['user_role']}</td>";
    echo "<td>{$user['last_message']}</td>";
    echo "<td>{$user['unread_count']}</td>";
    echo "</tr>";
}

echo "</table>";
?>
