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

if (!$data || !isset($data['student_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Student ID is required']);
    exit;
}

$studentId = intval($data['student_id']);

// Log the incoming data for debugging
$debugMessage = date('Y-m-d H:i:s') . " - Update request for student $studentId: " . json_encode($data) . "\n";
file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

// Auto-calculate level_id if birthdate is being updated but level_id is not provided
$birthdate = $data['stud_birthdate'] ?? $data['user_birthdate'] ?? null;
if ($birthdate && !isset($data['level_id']) && !isset($data['levelId'])) {
    try {
        $birthDateObj = new DateTime($birthdate);
        $referenceDate = new DateTime("2025-08-04");
        $diff = $referenceDate->diff($birthDateObj);
        
        // Calculate age in years with months
        $years = $diff->y;
        $months = $diff->m;
        $age = $years + ($months / 12);
        
        // Determine level based on age
        $calculatedLevelId = null;
        if ($age >= 1.8 && $age < 3) {
            $calculatedLevelId = 1; // Discoverer
        } else if ($age >= 3 && $age < 4) {
            $calculatedLevelId = 2; // Explorer
        } else if ($age >= 4 && $age < 5) {
            $calculatedLevelId = 3; // Adventurer
        }
        
        if ($calculatedLevelId !== null) {
            $data['level_id'] = $calculatedLevelId;
        }
    } catch (Exception $e) {
        error_log("Failed to auto-calculate level_id: " . $e->getMessage());
    }
}

try {
    $conn->beginTransaction();
    
    // Build update fields for tbl_students
    $fields = [];
    $params = [];
    $editable = [
        'stud_firstname', 'stud_middlename', 'stud_lastname', 'stud_birthdate',
        'stud_enrollment_date', 'stud_handedness', 'stud_gender', 'stud_schedule_class',
        'stud_photo', 'stud_school_status', 'level_id', 'parent_id', 'parent_profile_id'
    ];
    
    foreach ($editable as $col) {
        if (array_key_exists($col, $data)) {
            $val = $data[$col];
            if ($val === '' || is_null($val)) {
                $fields[] = "$col = NULL";
            } else {
                $fields[] = "$col = ?";
                $params[] = $val;
            }
        }
    }
    
    // Also handle frontend field mappings (no address fields for students)
    $fieldMapping = [
        'firstName' => 'stud_firstname',
        'middleName' => 'stud_middlename', 
        'lastName' => 'stud_lastname',
        'user_birthdate' => 'stud_birthdate',
        'levelId' => 'level_id'
    ];
    
    foreach ($fieldMapping as $frontendKey => $backendCol) {
        if (isset($data[$frontendKey]) && !in_array($backendCol, array_column($fields, 0))) {
            $fields[] = "$backendCol = ?";
            $params[] = $data[$frontendKey];
        }
    }
    
    if (!empty($fields)) {
        $params[] = $studentId;
        $sql = "UPDATE tbl_students SET " . implode(", ", $fields) . " WHERE student_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
    }
    
    $conn->commit();
    
    // Log successful update
    $successMessage = date('Y-m-d H:i:s') . " - Successfully updated student $studentId\n";
    file_put_contents('../SystemLogs/debug_log.txt', $successMessage, FILE_APPEND);
    
    // System logging for restore actions - use direct SQL INSERT like login does
    if (isset($data['stud_school_status']) && $data['stud_school_status'] === 'Active') {
        try {
            $editorId = $data['editor_id'] ?? null;
            if ($editorId) {
                $action = 'Restored a student profile.';
                
                // Direct SQL INSERT like login does - works in both local and Vercel
                $logQuery = $conn->prepare("
                    INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
                    VALUES (:user_id, :target_user_id, :target_student_id, :action, NOW())
                ");
                
                $logQuery->bindParam(":user_id", $editorId, PDO::PARAM_INT);
                $logQuery->bindValue(":target_user_id", null, PDO::PARAM_NULL);
                $logQuery->bindParam(":target_student_id", $studentId, PDO::PARAM_INT);
                $logQuery->bindParam(":action", $action, PDO::PARAM_STR);
                $logQuery->execute();
                
                error_log("System log created successfully for student restore: User ID: $editorId, Action: $action, Target Student ID: $studentId");
            }
        } catch (Exception $logError) {
            error_log("Failed to create system log for student restore: " . $logError->getMessage());
        }
    }
    
    // Create role-specific success message for restore actions
    $successMessage = 'Student updated successfully';
    if (isset($data['stud_school_status']) && $data['stud_school_status'] === 'Active') {
        // This is a restore action, create role-specific message
        $successMessage = 'Student restored successfully!';
    }
    
    echo json_encode(['status' => 'success', 'message' => $successMessage]);
    
} catch (Exception $e) {
    $conn->rollBack();
    
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in update_student.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?> 