<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../connection.php';

try {
    // Update existing progress card notifications to have the [PROGRESS CARD] prefix
    $update_query = "UPDATE tbl_notifications 
                    SET notif_message = CONCAT('[PROGRESS CARD] ', notif_message)
                    WHERE notif_message LIKE '%Progress card%' 
                    AND notif_message NOT LIKE '%[PROGRESS CARD]%'";
    
    $stmt = $conn->prepare($update_query);
    $stmt->execute();
    $affected_rows = $stmt->rowCount();
    
    echo json_encode([
        'status' => 'success',
        'message' => "Updated $affected_rows progress card notifications with [PROGRESS CARD] prefix",
        'affected_rows' => $affected_rows
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 