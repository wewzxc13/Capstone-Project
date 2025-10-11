<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Only POST requests are allowed."]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $data['user_id'] ?? null;
$user_role = $data['user_role'] ?? null;

if (!$user_id || !$user_role) {
    echo json_encode(["status" => "error", "message" => "Missing user_id or user_role."]);
    exit;
}

try {
    // Get notifications for the user based on their role
    $notifications = [];
    
    if ($user_role === 'Super Admin' || $user_role === 'SuperAdmin') {
        // Super Admin sees all OVERALL PROGRESS notifications (not QUARTERLY PROGRESS)
        $sql = "
            SELECT DISTINCT n.notification_id, n.notif_message, n.created_by, n.created_at,
                   nr.user_id as recipient_user_id, nr.recipient_type, pn.student_id,
                   s.stud_firstname, s.stud_middlename, s.stud_lastname,
                   u.user_firstname, u.user_lastname
            FROM tbl_notifications n
            INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
            INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
            LEFT JOIN tbl_students s ON pn.student_id = s.student_id
            LEFT JOIN tbl_users u ON n.created_by = u.user_id
            WHERE n.notif_message LIKE '%[OVERALL PROGRESS]%'
            AND pn.quarter_id IS NULL
            ORDER BY n.created_at DESC
            LIMIT 50
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as $row) {
            $studentName = trim($row['stud_firstname'] . ' ' . $row['stud_middlename'] . ' ' . $row['stud_lastname']);
            $teacherName = trim($row['user_firstname'] . ' ' . $row['user_lastname']);
            
            // Format message based on the stored notification type
            if (strpos($row['notif_message'], 'Finalized') !== false) {
                $message = "[OVERALL PROGRESS] Overall progress for $studentName has been finalized by $teacherName.";
            } else {
                $message = "[OVERALL PROGRESS] Overall progress for $studentName has been updated by $teacherName.";
            }
            
            $notifications[] = [
                'notification_id' => $row['notification_id'],
                'message' => $message,
                'created_at' => $row['created_at'],
                'student_id' => $row['student_id'],
                'student_name' => $studentName,
                'teacher_name' => $teacherName,
                'created_by' => $row['created_by']  // Add the created_by field for Super Admin
            ];
        }
        
    } else if ($user_role === 'Teacher') {
        // Teacher sees their own OVERALL PROGRESS notifications (not QUARTERLY PROGRESS)
        $sql = "
            SELECT DISTINCT n.notification_id, n.notif_message, n.created_by, n.created_at,
                   nr.user_id as recipient_user_id, nr.recipient_type, pn.student_id,
                   s.stud_firstname, s.stud_middlename, s.stud_lastname
            FROM tbl_notifications n
            INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
            INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
            LEFT JOIN tbl_students s ON pn.student_id = s.student_id
            WHERE nr.user_id = ? 
            AND nr.recipient_type = 'Teacher'
            AND n.notif_message LIKE '%[OVERALL PROGRESS]%'
            AND pn.quarter_id IS NULL
            ORDER BY n.created_at DESC
            LIMIT 50
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user_id]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as $row) {
            $studentName = trim($row['stud_firstname'] . ' ' . $row['stud_middlename'] . ' ' . $row['stud_lastname']);
            
            // Format message for teacher viewing their own actions
            if (strpos($row['notif_message'], 'Finalized') !== false) {
                $message = "[OVERALL PROGRESS] You finalized the overall progress for $studentName.";
            } else {
                $message = "[OVERALL PROGRESS] You updated the overall progress for $studentName.";
            }
            
            $notifications[] = [
                'notification_id' => $row['notification_id'],
                'message' => $message,
                'created_at' => $row['created_at'],
                'student_id' => $row['student_id'],
                'student_name' => $studentName,
                'created_by' => $user_id  // Add the created_by field for teachers
            ];
        }
    }
    
    echo json_encode([
        "status" => "success",
        "notifications" => $notifications
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?> 