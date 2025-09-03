<?php
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

if (!$data || !isset($data['student_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Student ID is required']);
    exit;
}

$studentId = intval($data['student_id']);

// Log the incoming data for debugging
$debugMessage = date('Y-m-d H:i:s') . " - Update request for student $studentId: " . json_encode($data) . "\n";
file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

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
        'user_birthdate' => 'stud_birthdate'
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
    
    // System logging for restore actions
    if (isset($data['stud_school_status']) && $data['stud_school_status'] === 'Active') {
        try {
            $editorId = $data['editor_id'] ?? null;
            if ($editorId) {
                $logData = [
                    'user_id' => $editorId,
                    'target_user_id' => null,
                    'target_student_id' => $studentId,
                    'action' => 'Restored a student profile.'
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
                
                error_log("System log creation attempt for student restore - HTTP Code: $httpCode, Response: " . $logResponse);
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