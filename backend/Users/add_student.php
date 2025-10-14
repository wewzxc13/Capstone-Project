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

if (!$data) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON input']);
    exit;
}

// Extract and sanitize student data
$firstName        = trim($data['stud_firstname'] ?? '');
$middleName       = trim($data['stud_middlename'] ?? '');
$lastName         = trim($data['stud_lastname'] ?? '');
$birthDate        = trim($data['stud_birthdate'] ?? '');
$enrollDate       = trim($data['stud_enrollment_date'] ?? '');
$handedness       = trim($data['stud_handedness'] ?? 'Not Yet Established');
$gender           = trim($data['stud_gender'] ?? '');
$scheduleClass    = trim($data['stud_schedule_class'] ?? '');
$photo            = trim($data['stud_photo'] ?? '');
$schoolStatus     = trim($data['stud_school_status'] ?? 'Active');

// Validate required fields
if (!$firstName || !$lastName || !$birthDate || !$gender || !$scheduleClass) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required student fields']);
    exit;
}

// Validate stud_schedule_class
if (!in_array($scheduleClass, ['Morning', 'Afternoon'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Schedule class must be either Morning or Afternoon']);
    exit;
}

// Default photo if none
if (!$photo) {
    // Assign default photo based on student gender
    if ($gender === 'Male') {
        $photo = 'default_boy_student.png';
    } else if ($gender === 'Female') {
        $photo = 'default_girl_student.png';
    } else {
        $photo = 'default_photo.jpg'; // fallback
    }
}

// ✅ Calculate level_id based on age
try {
    $birthDateObj = new DateTime($birthDate);
    $today = new DateTime();
    $age = $today->diff($birthDateObj)->y;

    switch ($age) {
        case 2:
            $levelId = 1;
            break;
        case 3:
            $levelId = 2;
            break;
        case 4:
            $levelId = 3;
            break;
        default:
            http_response_code(400);
            echo json_encode(['message' => 'Only students aged 2, 3, or 4 are allowed. Given age: ' . $age]);
            exit;
    }

    // Begin transaction
    $conn->beginTransaction();

    // Insert into tbl_students with parent_id as NULL
    $stmtStudent = $conn->prepare("INSERT INTO tbl_students (
        parent_id, level_id,
        stud_firstname, stud_middlename, stud_lastname, stud_birthdate,
        stud_enrollment_date, stud_handedness, stud_gender,
        stud_schedule_class, stud_photo, stud_school_status
    ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmtStudent->execute([
        $levelId,
        $firstName,
        $middleName,
        $lastName,
        $birthDate,
        $enrollDate,
        $handedness,
        $gender,
        $scheduleClass,
        $photo,
        $schoolStatus
    ]);

    $studentId = $conn->lastInsertId();
    $conn->commit();

    // System logging for student creation
    try {
        $editorId = $data['editor_id'] ?? null; // Get the ID of the super admin who created the student
        
        if ($editorId) {
            $logData = [
                'user_id' => $editorId,
                'target_user_id' => null,
                'target_student_id' => $studentId,
                'action' => 'Created a new student profile.'
            ];
            
            $logResponse = file_get_contents(__DIR__ . '/../Logs/create_system_log.php', false, stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($logData)
                ]
            ]));
            
            // Log the system log creation attempt for debugging
            error_log("System log creation attempt for student creation: " . $logResponse);
        }
    } catch (Exception $logError) {
        // Don't fail the main operation if logging fails
        error_log("Failed to create system log for student creation: " . $logError->getMessage());
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Student added successfully',
        'student_id' => $studentId,
        'user_id' => $studentId, // for logging as target_user_id
        'level_id' => $levelId,
        'age' => $age,
        'default_photo' => $photo
    ]);
} catch (PDOException $e) {
    $conn->rollBack();
    
    // Log the specific error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in add_student.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Database error', 
        'error' => $e->getMessage(),
        'details' => 'Check error log for more information'
    ]);
}
