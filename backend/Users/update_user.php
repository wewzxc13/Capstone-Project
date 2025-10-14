<?php
// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST requests are allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'User ID is required']);
    exit;
}

$user_id = intval($data['user_id']);

// Log the incoming data for debugging
$debugMessage = date('Y-m-d H:i:s') . " - Update request for user $user_id: " . json_encode($data) . "\n";
file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

// Check for unique email before updating
$email = $data['user_email'] ?? '';
$user_id = $data['user_id'] ?? 0;
if ($email && $user_id) {
    $stmt = $conn->prepare("SELECT user_id FROM tbl_users WHERE user_email = ? AND user_id != ?");
    $stmt->execute([$email, $user_id]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['message' => 'Email already exists. Please use a different email.']);
        exit;
    }
}

try {
    $conn->beginTransaction();
    
    // Get the user's current role first
    $stmt = $conn->prepare("SELECT user_role FROM tbl_users WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception("User not found");
    }
    
    $userRole = $user['user_role'];
    
    // Build update fields for tbl_users
    $fields = [];
    $params = [];
    $editable = [
        'user_firstname', 'user_middlename', 'user_lastname', 'user_email', 'user_contact_no',
        'user_birthdate', 'user_status', 'user_role', 'user_photo'
    ];
    
    foreach ($editable as $col) {
        if (isset($data[$col])) {
            $fields[] = "$col = ?";
            $params[] = $data[$col];
        }
    }
    
    // Debug logging for all fields being updated
    $fieldsDebugMessage = date('Y-m-d H:i:s') . " - Fields to update for user $user_id: " . json_encode($fields) . "\n";
    file_put_contents('../SystemLogs/debug_log.txt', $fieldsDebugMessage, FILE_APPEND);
    
    $dataDebugMessage = date('Y-m-d H:i:s') . " - Data received for user $user_id: " . json_encode($data) . "\n";
    file_put_contents('../SystemLogs/debug_log.txt', $dataDebugMessage, FILE_APPEND);
    
    // Update tbl_users if there are fields to update
    if (!empty($fields)) {
        $params[] = $user_id;
        $sql = "UPDATE tbl_users SET " . implode(", ", $fields) . " WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        // Debug logging for photo updates
        if (isset($data['user_photo'])) {
            $photoDebugMessage = date('Y-m-d H:i:s') . " - Photo update for user $user_id: " . $data['user_photo'] . "\n";
            file_put_contents('../SystemLogs/debug_log.txt', $photoDebugMessage, FILE_APPEND);
            
            // Also log the SQL query and parameters
            $sqlDebugMessage = date('Y-m-d H:i:s') . " - SQL Query: $sql\n";
            file_put_contents('../SystemLogs/debug_log.txt', $sqlDebugMessage, FILE_APPEND);
            
            $paramsDebugMessage = date('Y-m-d H:i:s') . " - Parameters: " . json_encode($params) . "\n";
            file_put_contents('../SystemLogs/debug_log.txt', $paramsDebugMessage, FILE_APPEND);
        }
    }

    // Update address and government IDs based on user role
    if ($userRole == 1 || $userRole == 2 || $userRole == 3) { // Super Admin, Admin, or Teacher
        // Handle government IDs and address for Admin/Teacher
        $govFields = [];
        $govParams = [];
        
        // Map frontend fields to backend columns
        $fieldMapping = [
            'tin_number' => 'tin_number',
            'sss_number' => 'sss_number', 
            'pagibig_number' => 'pagibig_number',
            'barangay' => 'barangay',
            'city' => 'city_municipality',
            'province' => 'province',
            'country' => 'country',
            'region' => 'country' // Map region to country field
        ];
        
        foreach ($fieldMapping as $frontendKey => $backendCol) {
            if (isset($data[$frontendKey])) {
                $govFields[] = "$backendCol = ?";
                $govParams[] = $data[$frontendKey];
            }
        }
        
        if (!empty($govFields)) {
            // Check if record exists in tbl_add_info
            $stmt = $conn->prepare("SELECT user_id FROM tbl_add_info WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $exists = $stmt->fetch();
            
            if ($exists) {
                // Update existing record
                $govParams[] = $user_id;
                $sql2 = "UPDATE tbl_add_info SET " . implode(", ", $govFields) . " WHERE user_id = ?";
                $stmt = $conn->prepare($sql2);
                $stmt->execute($govParams);
            } else {
                // Insert new record
                $columns = ['user_id'];
                $placeholders = ['?'];
                $insertParams = [$user_id];
                
                foreach ($fieldMapping as $frontendKey => $backendCol) {
                    if (isset($data[$frontendKey])) {
                        $columns[] = $backendCol;
                        $placeholders[] = '?';
                        $insertParams[] = $data[$frontendKey];
                    }
                }
                
                $sql2 = "INSERT INTO tbl_add_info (" . implode(", ", $columns) . ") VALUES (" . implode(", ", $placeholders) . ")";
                $stmt = $conn->prepare($sql2);
                $stmt->execute($insertParams);
            }
        }
        
    } elseif ($userRole == 4) { // Parent
        // Handle address for Parent
        $parentFields = [];
        $parentParams = [];
        
        // Map frontend fields to backend columns for parents
        // Note: Frontend sends 'municipality_city' but database expects 'city_municipality'
        $fieldMapping = [
            'father_name' => 'father_name',
            'father_age' => 'father_age',
            'father_occupation' => 'father_occupation',
            'mother_name' => 'mother_name',
            'mother_age' => 'mother_age',
            'mother_occupation' => 'mother_occupation',
            'barangay' => 'barangay',
            'municipality_city' => 'city_municipality', // Map frontend field to database field
            'province' => 'province', 
            'country' => 'country',
            'region' => 'country' // Map region to country field
        ];
        
        foreach ($fieldMapping as $frontendKey => $backendCol) {
            if (isset($data[$frontendKey])) {
                $parentFields[] = "$backendCol = ?";
                $parentParams[] = $data[$frontendKey];
            }
        }
        
        if (!empty($parentFields)) {
            // Check if record exists in tbl_parents_profile
            $stmt = $conn->prepare("SELECT user_id FROM tbl_parents_profile WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $exists = $stmt->fetch();
            
            if ($exists) {
                // Update existing record
                $parentParams[] = $user_id;
                $sql2 = "UPDATE tbl_parents_profile SET " . implode(", ", $parentFields) . " WHERE user_id = ?";
                $stmt = $conn->prepare($sql2);
                $stmt->execute($parentParams);
            } else {
                // Insert new record
                $columns = ['user_id'];
                $placeholders = ['?'];
                $insertParams = [$user_id];
                
                foreach ($fieldMapping as $frontendKey => $backendCol) {
                    if (isset($data[$frontendKey])) {
                        $columns[] = $backendCol;
                        $placeholders[] = '?';
                        $insertParams[] = $data[$frontendKey];
                    }
                }
                
                $sql2 = "INSERT INTO tbl_parents_profile (" . implode(", ", $columns) . ") VALUES (" . implode(", ", $placeholders) . ")";
                $stmt = $conn->prepare($sql2);
                $stmt->execute($insertParams);
            }
        }
    }
    
    $conn->commit();
    
    // Log successful update
    $successMessage = date('Y-m-d H:i:s') . " - Successfully updated user $user_id\n";
    file_put_contents('../SystemLogs/debug_log.txt', $successMessage, FILE_APPEND);
    
    // System logging for restore actions
    if (isset($data['user_status']) && $data['user_status'] === 'Active') {
        try {
            $editorId = $data['editor_id'] ?? null;
            if ($editorId) {
                // Determine the specific role for the action message
                $roleNames = [
                    2 => 'admin',
                    3 => 'teacher', 
                    4 => 'parent'
                ];
                
                $roleName = $roleNames[$userRole] ?? 'user';
                $article = ($userRole === 2) ? 'an' : 'a'; // Admin uses 'an', others use 'a'
                $action = "Restored $article $roleName account.";
                
                $logData = [
                    'user_id' => $editorId,
                    'target_user_id' => $user_id,
                    'target_student_id' => null,
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
                
                error_log("System log creation attempt for user restore - HTTP Code: $httpCode, Response: " . $logResponse);
            }
        } catch (Exception $logError) {
            error_log("Failed to create system log for user restore: " . $logError->getMessage());
        }
    }
    
    // Create role-specific success message for restore actions
    $successMessage = 'User updated successfully';
    if (isset($data['user_status']) && $data['user_status'] === 'Active') {
        // This is a restore action, create role-specific message
        $roleNames = [
            2 => 'Admin',
            3 => 'Teacher', 
            4 => 'Parent'
        ];
        
        $roleName = $roleNames[$userRole] ?? 'User';
        $successMessage = "$roleName restored successfully!";
    }
    
    echo json_encode(['status' => 'success', 'message' => $successMessage]);
    
} catch (Exception $e) {
    $conn->rollBack();
    
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in update_user.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?> 