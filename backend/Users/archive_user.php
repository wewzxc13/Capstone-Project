<?php
// Archive user functionality
// - Archives users by setting status to 'Inactive'
// - Archives students by setting stud_school_status to 'Inactive'
// - Parent archiving with student unlinking is handled in the frontend

// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST requests are allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id']) || !isset($data['role'])) {
    http_response_code(400);
    echo json_encode(['message' => 'User ID and role are required']);
    exit;
}

$userId = intval($data['user_id']);
$role = $data['role'];

// Log the incoming data for debugging
$debugMessage = date('Y-m-d H:i:s') . " - Archive request for user $userId with role $role: " . json_encode($data) . "\n";
file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

try {
    $conn->beginTransaction();
    
    if ($role === "Student") {
        // Archive student by updating stud_school_status to 'Inactive'
        $stmt = $conn->prepare("UPDATE tbl_students SET stud_school_status = 'Inactive' WHERE student_id = ?");
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Student not found");
        }
        
        // Log successful archive
        $successMessage = date('Y-m-d H:i:s') . " - Successfully archived student $userId\n";
        file_put_contents('../SystemLogs/debug_log.txt', $successMessage, FILE_APPEND);
        
    } else {
        // Archive user by updating user_status to 'Inactive'
        $stmt = $conn->prepare("UPDATE tbl_users SET user_status = 'Inactive' WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("User not found");
        }
        
        // Log successful archive
        $successMessage = date('Y-m-d H:i:s') . " - Successfully archived user $userId\n";
        file_put_contents('../SystemLogs/debug_log.txt', $successMessage, FILE_APPEND);
        
        // Note: Parent archiving with student unlinking is now handled in the frontend
        // This ensures proper unlinking of students before archiving the parent
    }
    
    $conn->commit();
    
    // System logging for user archiving - use direct SQL INSERT like login does
    try {
        $editorId = $data['editor_id'] ?? null; // Get the ID of the admin who archived the user
        
        if ($editorId) {
            $action = '';
            $targetUserId = null;
            $targetStudentId = null;
            
            if ($role === "Student") {
                $action = 'Archived a student profile.';
                $targetStudentId = $userId;
                $targetUserId = null;
            } else {
                // Determine the specific role for the action message
                $roleQuery = $conn->prepare("SELECT user_role FROM tbl_users WHERE user_id = ?");
                $roleQuery->execute([$userId]);
                $userRole = $roleQuery->fetchColumn();
                
                switch ($userRole) {
                    case 2: // Admin
                        $action = 'Archived an admin account.';
                        break;
                    case 3: // Teacher
                        $action = 'Archived a teacher account.';
                        break;
                    case 4: // Parent
                        $action = 'Archived a parent account.';
                        break;
                    default:
                        $action = 'Archived a user account.';
                        break;
                }
                $targetUserId = $userId;
                $targetStudentId = null;
            }
            
            if ($action) {
                // Direct SQL INSERT like login does - works in both local and Vercel
                $logQuery = $conn->prepare("
                    INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
                    VALUES (:user_id, :target_user_id, :target_student_id, :action, NOW())
                ");
                
                // Bind values with proper null handling
                if ($targetUserId !== null) {
                    $logQuery->bindParam(":target_user_id", $targetUserId, PDO::PARAM_INT);
                } else {
                    $logQuery->bindValue(":target_user_id", null, PDO::PARAM_NULL);
                }
                
                if ($targetStudentId !== null) {
                    $logQuery->bindParam(":target_student_id", $targetStudentId, PDO::PARAM_INT);
                } else {
                    $logQuery->bindValue(":target_student_id", null, PDO::PARAM_NULL);
                }
                
                $logQuery->bindParam(":user_id", $editorId, PDO::PARAM_INT);
                $logQuery->bindParam(":action", $action, PDO::PARAM_STR);
                $logQuery->execute();
                
                error_log("System log created successfully for user archiving: User ID: $editorId, Action: $action, Target User ID: $targetUserId, Target Student ID: $targetStudentId");
            }
        }
    } catch (Exception $logError) {
        // Don't fail the main operation if logging fails
        error_log("Failed to create system log for user archiving: " . $logError->getMessage());
    }
    
    // Create role-specific success message
    $successMessage = '';
    if ($role === "Student") {
        $successMessage = 'Student archived successfully!';
    } else {
        // Determine the specific role for the success message
        $roleQuery = $conn->prepare("SELECT user_role FROM tbl_users WHERE user_id = ?");
        $roleQuery->execute([$userId]);
        $userRole = $roleQuery->fetchColumn();
        
        switch ($userRole) {
            case 2: // Admin
                $successMessage = 'Admin archived successfully!';
                break;
            case 3: // Teacher
                $successMessage = 'Teacher archived successfully!';
                break;
            case 4: // Parent
                $successMessage = 'Parent archived successfully!';
                break;
            default:
                $successMessage = 'User archived successfully!';
                break;
        }
    }
    
    echo json_encode([
        'status' => 'success', 
        'message' => $successMessage
    ]);
    
} catch (Exception $e) {
    $conn->rollBack();
    
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in archive_user.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?> 