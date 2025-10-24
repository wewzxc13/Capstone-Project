<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../connection.php';

// Check if there was a connection error
if (isset($connection_error)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $connection_error
    ]);
    exit;
}

try {
    // Simple query to get all overall progress notifications
    $query = "
        SELECT 
            notification_id,
            notif_message as message,
            created_by,
            created_at
        FROM tbl_notifications 
        WHERE (notif_message LIKE '%[OVERALL PROGRESS]%' OR notif_message LIKE '%overall progress%')
        ORDER BY created_at DESC
        LIMIT 10
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'notifications' => $notifications,
        'count' => count($notifications),
        'query' => $query
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn = null;
?> 