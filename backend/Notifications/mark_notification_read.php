<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

include_once '../connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['user_id']) || !isset($input['notification_type']) || !isset($input['notification_id'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
        exit;
    }
    
    $userId = $input['user_id'];
    $notificationType = $input['notification_type'];
    $notificationId = $input['notification_id'];
    $userRole = $input['user_role'] ?? '';
    
    $conn->beginTransaction();
    
    switch ($notificationType) {
        case 'meeting':
        case 'general_meeting':
        case 'progress_card':
        case 'overall_progress':
                         // For Admin and Super Admin, mark notification as seen using admin views table
             if ($userRole === 'SuperAdmin' || $userRole === 'Super Admin' || $userRole === 'Admin') {
                $stmt = $conn->prepare("
                    INSERT INTO tbl_notification_admin_views (user_id, notification_id)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE viewed_at = NOW()
                ");
                $stmt->execute([$userId, $notificationId]);
                
                $conn->commit();
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Notification marked as seen successfully'
                ]);
                exit;
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid notification type']);
            exit;
    }
    
    $conn->commit();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Notification marked as read successfully'
    ]);
    
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>
