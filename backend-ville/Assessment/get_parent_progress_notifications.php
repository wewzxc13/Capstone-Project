<?php
require_once __DIR__ . '/../connection.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['user_role'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit();
}

$parentUserId = intval($data['user_id']);
$userRole = $data['user_role'];

// Verify user is a parent
if ($userRole !== 'Parent') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Access denied. Only parents can view this data.']);
    exit();
}

try {
    // Check if database connection was successful
    if (isset($connection_error)) {
        throw new Exception('Database connection failed: ' . $connection_error);
    }
    
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not available');
    }
    
    // Get students linked to this parent through tbl_students.parent_id
    $stmt = $conn->prepare("
        SELECT s.student_id, s.stud_firstname, s.stud_lastname, s.stud_middlename
        FROM tbl_students s
        WHERE s.parent_id = ? AND s.stud_school_status = 'Active'
    ");
    $stmt->execute([$parentUserId]);
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($children)) {
        echo json_encode([
            'status' => 'success',
            'notifications' => [],
            'message' => 'No children found for this parent'
        ]);
        exit();
    }
    
    $childIds = array_column($children, 'student_id');
    $placeholders = str_repeat('?,', count($childIds) - 1) . '?';
    
    // Get progress notifications for the parent's children
    $stmt = $conn->prepare("
        SELECT 
            n.notification_id,
            n.notif_message,
            n.created_at,
            n.created_by,
            pn.student_id,
            pn.quarter_id,
            q.quarter_name
        FROM tbl_notifications n
        LEFT JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
        LEFT JOIN tbl_quarters q ON pn.quarter_id = q.quarter_id
        WHERE pn.student_id IN ($placeholders)
        AND n.notif_message LIKE '%[QUARTERLY PROGRESS]%'
        ORDER BY n.created_at DESC
    ");
    
    $stmt->execute($childIds);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the notifications for display
    $formattedNotifications = [];
    foreach ($notifications as $notification) {
        $studentName = '';
        foreach ($children as $child) {
            if ($child['student_id'] == $notification['student_id']) {
                $studentName = trim($child['stud_firstname'] . ' ' . $child['stud_middlename'] . ' ' . $child['stud_lastname']);
                break;
            }
        }
        
        // Get teacher name who created the notification
        $teacherName = 'Teacher';
        if ($notification['created_by']) {
            $teacherStmt = $conn->prepare("SELECT user_firstname, user_lastname FROM tbl_users WHERE user_id = ?");
            $teacherStmt->execute([$notification['created_by']]);
            $teacher = $teacherStmt->fetch(PDO::FETCH_ASSOC);
            if ($teacher) {
                $teacherName = trim($teacher['user_firstname'] . ' ' . $teacher['user_lastname']);
            }
        }
        
        // Format the message
        $quarterInfo = '';
        if ($notification['quarter_name']) {
            $quarterInfo = " for {$notification['quarter_name']}";
        }
        
        $message = '';
        if (strpos($notification['notif_message'], 'Finalized') !== false) {
            $message = "[QUARTERLY PROGRESS] Quarterly progress{$quarterInfo} for {$studentName} has been finalized by {$teacherName}.";
        } else {
            $message = "[QUARTERLY PROGRESS] {$notification['notif_message']} for {$studentName}.";
        }
        
        $formattedNotifications[] = [
            'notification_id' => $notification['notification_id'],
            'message' => $message,
            'created_at' => $notification['created_at'],
            'created_by' => $notification['created_by'],
            'student_id' => $notification['student_id'],
            'quarter_id' => $notification['quarter_id'],
            'quarter_name' => $notification['quarter_name']
        ];
    }
    
    echo json_encode([
        'status' => 'success',
        'notifications' => $formattedNotifications,
        'message' => 'Parent progress notifications retrieved successfully',
        'debug' => [
            'parent_user_id' => $parentUserId,
            'children_count' => count($children),
            'child_ids' => $childIds,
            'notifications_found' => count($formattedNotifications)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
