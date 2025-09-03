<?php
// Archive user functionality
// - Archives users by setting status to 'Inactive'
// - Archives students by setting stud_school_status to 'Inactive'
// - Parent archiving with student unlinking is handled in the frontend
// Dynamic CORS for localhost:3000+
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // fallback
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
    
    // System logging for user archiving
    try {
        $editorId = $data['editor_id'] ?? null; // Get the ID of the super admin who archived the user
        
        if ($editorId) {
            $action = '';
            if ($role === "Student") {
                $action = 'Archived a student profile.';
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
            }
            
            if ($action) {
                $logData = [
                    'user_id' => $editorId,
                    'target_user_id' => ($role === "Student") ? null : $userId,
                    'target_student_id' => ($role === "Student") ? $userId : null,
                    'action' => $action
                ];
                
                // Use cURL for proper HTTP request
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, (isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/capstone-project/backend/Logs/create_system_log.php');
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($logData));
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                
                $logResponse = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                // Log the system log creation attempt for debugging
                error_log("System log creation attempt for user archiving - HTTP Code: $httpCode, Response: " . $logResponse);
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