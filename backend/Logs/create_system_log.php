<?php
// Dynamic CORS for localhost:3000+
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // fallback
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

try {
    $inputJSON = file_get_contents("php://input");
    $input = json_decode($inputJSON, true);

    if (!isset($input['action'])) {
        throw new Exception("Missing action.");
    }

    // Sanitize/parse
    $rawUserId = $input['user_id'] ?? null;
    $userId = $rawUserId !== null ? (int)filter_var($rawUserId, FILTER_SANITIZE_NUMBER_INT) : null;
    $action = filter_var(trim($input['action']), FILTER_SANITIZE_STRING);
    
    // Get target IDs for user management actions
    $targetUserId = isset($input['target_user_id']) ? (int)filter_var($input['target_user_id'], FILTER_SANITIZE_NUMBER_INT) : null;
    $targetStudentId = isset($input['target_student_id']) ? (int)filter_var($input['target_student_id'], FILTER_SANITIZE_NUMBER_INT) : null;

    // Determine if this is an unauthorized attempt from login page
    $isUnauthorized = stripos($action, 'unauthorized login attempt') !== false;

    if ($isUnauthorized) {
        // Allow null user for unauthorized attempts
        $userId = ($userId && $userId > 0) ? $userId : null;
    } else {
        // For standard Login/Logout, enforce validation
        if (!$userId || $userId <= 0) {
            throw new Exception("Invalid user_id provided.");
        }
        
        // Define allowed actions - expanded to include all user management actions
        $allowedActions = [
            'Login', 'Logout',
            // User management specific actions
            'Edit', 'Edited their own details.',
            'Edited the details of an admin account.',
            'Edited the details of a teacher account.',
            'Edited the details of a parent account.',
            'Edited the details of a student profile.',
            'Edited the details of their child profile.',
            'Created a new admin account.',
            'Created a new teacher account.',
            'Created a new parent account.',
            'Created a new student profile.',
            'Archived an admin account.',
            'Archived a teacher account.',
            'Archived a parent account.',
            'Archived a student profile.',
            'Restored an admin account.',
            'Restored a teacher account.',
            'Restored a parent account.',
            'Restored a student profile.'
        ];
        
        if (!in_array($action, $allowedActions)) {
            throw new Exception("Invalid action. Must be one of the allowed actions.");
        }
    }

    // Verify user exists for non-unauthorized actions
    if (!$isUnauthorized) {
        $userCheckQuery = $conn->prepare("
        SELECT user_id FROM tbl_users WHERE user_id = :user_id AND user_status = 'Active'
    ");
        $userCheckQuery->bindParam(":user_id", $userId);
        $userCheckQuery->execute();
        if ($userCheckQuery->rowCount() == 0) {
            throw new Exception("User not found or inactive.");
        }
    }

    // Logout validation (skip for unauthorized entries) - PRESERVING EXISTING LOGIC
    if (!$isUnauthorized && $action === 'Logout') {
        // Debug logging
        error_log("Processing manual logout request for user ID: $userId");

        // Check if user has a recent login record (within last 24 hours) before allowing logout
        // This prevents orphaned logout records while being more flexible than daily restriction
        $checkLoginQuery = $conn->prepare("
            SELECT COUNT(*) as login_count 
            FROM tbl_system_logs 
            WHERE user_id = :user_id 
            AND action = 'Login' 
            AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $checkLoginQuery->bindParam(":user_id", $userId);
        $checkLoginQuery->execute();
        $loginResult = $checkLoginQuery->fetch(PDO::FETCH_ASSOC);

        error_log("Recent login count: " . $loginResult['login_count']);

        if ($loginResult['login_count'] == 0) {
            error_log("Logout rejected - no recent login found");
            echo json_encode([
                "success" => false,
                "message" => "Cannot log logout - no recent login record found within 24 hours"
            ]);
            exit();
        }

        error_log("Logout validation passed - proceeding with logout log creation");
    }

    // Insert the system log record with proper target IDs
    $query = $conn->prepare("
        INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
        VALUES (:user_id, :target_user_id, :target_student_id, :action, NOW())
    ");

    if ($userId === null) {
        $query->bindValue(":user_id", null, PDO::PARAM_NULL);
    } else {
        $query->bindValue(":user_id", $userId, PDO::PARAM_INT);
    }
    
    // Bind target IDs based on action type
    if ($targetUserId !== null) {
        $query->bindValue(":target_user_id", $targetUserId, PDO::PARAM_INT);
    } else {
        $query->bindValue(":target_user_id", null, PDO::PARAM_NULL);
    }
    
    if ($targetStudentId !== null) {
        $query->bindValue(":target_student_id", $targetStudentId, PDO::PARAM_INT);
    } else {
        $query->bindValue(":target_student_id", null, PDO::PARAM_NULL);
    }
    
    $query->bindValue(":action", $action, PDO::PARAM_STR);

    if ($query->execute()) {
        // Log successful operation for debugging
        error_log("System log created successfully: User ID: " . ($userId ?? 'NULL') . ", Action: $action, Target User ID: " . ($targetUserId ?? 'NULL') . ", Target Student ID: " . ($targetStudentId ?? 'NULL') . ", Timestamp: " . date('Y-m-d H:i:s'));

        echo json_encode([
            "success" => true,
            "message" => "System log created successfully",
            "log_id" => $conn->lastInsertId()
        ]);
    } else {
        throw new Exception("Failed to insert system log.");
    }

} catch (Exception $e) {
    // Log error for debugging
    error_log("System log creation failed: " . $e->getMessage() . " - User ID: " . ($input['user_id'] ?? 'unknown') . " - Action: " . ($input['action'] ?? 'unknown'));

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?> 