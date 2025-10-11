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
    
    if (!isset($input['user_id']) || !isset($input['user_role'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing required parameters']);
        exit;
    }
    
    $userId = $input['user_id'];
    $userRole = $input['user_role'];
    
    $notifications = [];
    
         // For Admin and Super Admin, get all notifications with seen status using admin views table
     if ($userRole === 'SuperAdmin' || $userRole === 'Super Admin' || $userRole === 'Admin') {
        
        // Get all notifications with admin seen status using separate queries and combine in PHP
        $allNotifications = [];
        
        // 1. Get meeting notifications
        $meetingStmt = $conn->prepare("
            SELECT 
                n.notification_id,
                n.notif_message,
                n.created_by,
                n.created_at,
                n.meeting_id,
                m.meeting_title,
                m.meeting_start,
                m.meeting_end,
                m.meeting_status,
                m.parent_id,
                m.student_id,
                m.advisory_id,
                (v.notification_id IS NOT NULL) AS admin_seen,
                v.viewed_at AS admin_viewed_at,
                NULL AS quarter_id,
                NULL AS progress_student_id,
                NULL AS quarter_name,
                NULL AS stud_firstname,
                NULL AS stud_middlename,
                NULL AS stud_lastname,
                'meeting' AS notification_type
            FROM tbl_notifications n
            LEFT JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
            LEFT JOIN tbl_notification_admin_views v
              ON v.notification_id = n.notification_id AND v.user_id = ?
            WHERE n.meeting_id IS NOT NULL
            ORDER BY n.created_at DESC
        ");
        
        $meetingStmt->execute([$userId]);
        $meetingNotifications = $meetingStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 2. Get progress notifications
        $progressStmt = $conn->prepare("
            SELECT 
                n.notification_id,
                n.notif_message,
                n.created_by,
                n.created_at,
                NULL AS meeting_id,
                NULL AS meeting_title,
                NULL AS meeting_start,
                NULL AS meeting_end,
                NULL AS meeting_status,
                NULL AS parent_id,
                NULL AS student_id,
                NULL AS advisory_id,
                (v.notification_id IS NOT NULL) AS admin_seen,
                v.viewed_at AS admin_viewed_at,
                pn.quarter_id,
                pn.student_id AS progress_student_id,
                q.quarter_name,
                s.stud_firstname,
                s.stud_middlename,
                s.stud_lastname,
                'progress' AS notification_type
            FROM tbl_notifications n
            INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
            LEFT JOIN tbl_quarters q ON pn.quarter_id = q.quarter_id
            LEFT JOIN tbl_students s ON pn.student_id = s.student_id
            LEFT JOIN tbl_notification_admin_views v
              ON v.notification_id = n.notification_id AND v.user_id = ?
            WHERE n.meeting_id IS NULL
            ORDER BY n.created_at DESC
        ");
        
        $progressStmt->execute([$userId]);
        $progressNotifications = $progressStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 3. Combine and sort by created_at DESC
        $allNotifications = array_merge($meetingNotifications, $progressNotifications);
        usort($allNotifications, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        // Process and categorize notifications
        foreach ($allNotifications as $notification) {
            // Determine notification type and format based on the notification_type field
            if ($notification['notification_type'] === 'meeting') {
                // This is a meeting notification
                if ($notification['parent_id'] === null && $notification['student_id'] === null && $notification['advisory_id'] === null) {
                    // General meeting
                    $notification['type'] = 'general_meeting';
                    $notification['category'] = 'General Meeting';
                } else {
                    // One-on-one meeting
                    $notification['type'] = 'one_on_one_meeting';
                    $notification['category'] = 'One-on-One Meeting';
                }
            } else if ($notification['notification_type'] === 'progress') {
                // This is a progress notification
                $notification['type'] = 'progress_notification';
                $notification['category'] = 'Progress Notification';
                
                // Add progress-specific fields for frontend formatting
                if ($notification['progress_student_id']) {
                    // Construct student name
                    $firstName = $notification['stud_firstname'] ?? '';
                    $middleName = $notification['stud_middlename'] ?? '';
                    $lastName = $notification['stud_lastname'] ?? '';
                    $notification['student_name'] = trim($firstName . ' ' . $middleName . ' ' . $lastName);
                    
                    // Add quarter information
                    $notification['quarter_name'] = $notification['quarter_name'] ?? '';
                }
            }
            
            // Add admin-specific fields
            $notification['is_read'] = (bool)$notification['admin_seen'];
            $notification['read_status'] = $notification['admin_seen'] ? 'seen_by_admin' : 'unseen_by_admin';
            $notification['admin_viewed_at'] = $notification['admin_viewed_at'];
            
            $notifications[] = $notification;
        }
        
    } else {
        // For other roles, return empty array (will be implemented later)
        $notifications = [];
    }
    
         // Calculate counts for Admin and Super Admin
     $totalCount = count($notifications);
     $unseenCount = count(array_filter($notifications, function($n) { 
         return !$n['admin_seen']; 
     }));
     $seenCount = count(array_filter($notifications, function($n) { 
         return $n['admin_seen']; 
     }));
     
     // Category breakdown
     $categoryBreakdown = [
         'general_meetings' => count(array_filter($notifications, function($n) { 
             return $n['type'] === 'general_meeting'; 
         })),
         'one_on_one_meetings' => count(array_filter($notifications, function($n) { 
             return $n['type'] === 'one_on_one_meeting'; 
         })),
         'progress_notifications' => count(array_filter($notifications, function($n) { 
             return $n['type'] === 'progress_notification'; 
         }))
     ];
    
    echo json_encode([
        'status' => 'success',
        'notifications' => $notifications,
        'total_count' => $totalCount,
        'unseen_count' => $unseenCount,
        'seen_count' => $seenCount,
        'category_breakdown' => $categoryBreakdown
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error',
        'error' => $e->getMessage()
    ]);
}
?>
