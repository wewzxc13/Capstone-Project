<?php
// Test script to verify read receipt system
header('Content-Type: application/json');

include_once 'backend/connection.php';

try {
    // Test the read receipt detection
    $userId = 1; // Super Admin user ID
    $lastCheckTime = date('Y-m-d H:i:s', strtotime('-1 hour'));
    
    // Check for read receipts
    $stmt = $conn->prepare("
        SELECT 
            c.message_id,
            c.sender_id,
            c.receiver_id,
            c.sent_at,
            c.read_at,
            u.user_firstname,
            u.user_middlename,
            u.user_lastname,
            u.user_role,
            'sent_by_user' as receipt_type
        FROM tbl_communication c
        LEFT JOIN tbl_users u ON u.user_id = c.receiver_id
        WHERE c.sender_id = :user_id 
        AND c.is_read = 1
        AND c.read_at IS NOT NULL
        AND c.read_at > :last_check
        
        UNION ALL
        
        SELECT 
            c.message_id,
            c.sender_id,
            c.receiver_id,
            c.sent_at,
            c.read_at,
            u.user_firstname,
            u.user_middlename,
            u.user_lastname,
            u.user_role,
            'received_by_user' as receipt_type
        FROM tbl_communication c
        LEFT JOIN tbl_users u ON u.user_id = c.sender_id
        WHERE c.receiver_id = :user_id 
        AND c.is_read = 1
        AND c.read_at IS NOT NULL
        AND c.read_at > :last_check
        
        ORDER BY read_at ASC
    ");
    
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':last_check', $lastCheckTime, PDO::PARAM_STR);
    $stmt->execute();
    $readReceipts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'user_id' => $userId,
        'last_check' => $lastCheckTime,
        'read_receipts_count' => count($readReceipts),
        'read_receipts' => $readReceipts
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
