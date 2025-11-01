<?php
// Set error reporting to avoid HTML errors in JSON response
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors, but log them
ini_set('log_errors', 1);

// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

// Set Content-Type header to ensure JSON response
header('Content-Type: application/json');

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
$parentId         = isset($data['parent_id']) ? intval($data['parent_id']) : null;
$parentProfileId  = isset($data['parent_profile_id']) ? intval($data['parent_profile_id']) : null;
$manualLevelId    = isset($data['level_id']) ? intval($data['level_id']) : null; // Manual level assignment
// For stud_notes: null for automatic assignments, trimmed string for manual assignments
$studNotes        = isset($data['stud_notes']) && $data['stud_notes'] !== null ? trim($data['stud_notes']) : null;

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

// ✅ Calculate or use manual level_id
try {
    $levelId = null;
    $age = null; // Initialize age variable
    
    // Use manual level_id if provided, otherwise calculate from age
    if ($manualLevelId !== null && $manualLevelId >= 1 && $manualLevelId <= 3) {
        // Validate manual level assignment - notes are required
        if ($studNotes === null || trim($studNotes) === '') {
            http_response_code(400);
            echo json_encode(['message' => 'Notes are required when manually assigning a class level']);
            exit;
        }
        $levelId = $manualLevelId;
        // Age is not calculated in manual mode since it doesn't determine the level
    } else {
        // Calculate level_id based on age (automatic assignment)
        // Note: Date of birth is still required but age validation only applies in automatic mode
        // Get Quarter 1 start date as reference date (same as get_student_age_requirements.php)
        $stmtQuarter = $conn->prepare('SELECT start_date FROM tbl_quarters WHERE quarter_id = 1 ORDER BY start_date DESC LIMIT 1');
        $stmtQuarter->execute();
        $quarter1 = $stmtQuarter->fetch(PDO::FETCH_ASSOC);
        
        if (!$quarter1 || !$quarter1['start_date']) {
            http_response_code(500);
            echo json_encode(['message' => 'Quarter 1 start date not found in database']);
            exit;
        }
        
        $referenceDate = new DateTime($quarter1['start_date']);
        $birthDateObj = new DateTime($birthDate);
        $interval = $birthDateObj->diff($referenceDate);
        $years = $interval->y;
        $months = $interval->m;
        $age = $years + ($months / 12);

        // Use the same age ranges as frontend validation (1.8-3, 3-4, 4-5)
        if ($age >= 1.8 && $age < 3) {
            $levelId = 1;
        } else if ($age >= 3 && $age < 4) {
            $levelId = 2;
        } else if ($age >= 4 && $age < 5) {
            $levelId = 3;
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Only students aged 1.8, 3, or 4 are allowed. Given age: ' . round($age, 1)]);
            exit;
        }
    }
    
    if ($levelId === null) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid level assignment']);
        exit;
    }

    // Begin transaction
    $conn->beginTransaction();

    // Insert into tbl_students with parent_id and parent_profile_id (if provided)
    $stmtStudent = $conn->prepare("INSERT INTO tbl_students (
        parent_id, parent_profile_id, level_id,
        stud_firstname, stud_middlename, stud_lastname, stud_birthdate,
        stud_enrollment_date, stud_handedness, stud_gender,
        stud_schedule_class, stud_photo, stud_school_status, stud_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmtStudent->execute([
        $parentId,        // parent_id from tbl_users.user_id
        $parentProfileId, // parent_profile_id from tbl_parents_profile.parent_profile_id
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
        $schoolStatus,
        $studNotes        // Notes for manual level assignment (empty if auto-assigned)
    ]);

    $studentId = $conn->lastInsertId();
    
    // ✅ Automatically assign student to advisory based on level_id
    if ($levelId) {
        // Find the advisory for this level
        $stmt = $conn->prepare("SELECT advisory_id FROM tbl_advisory WHERE level_id = ? LIMIT 1");
        $stmt->execute([$levelId]);
        $advisory = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($advisory && $advisory['advisory_id']) {
            $advisoryId = $advisory['advisory_id'];
            
            // Remove any previous assignment for this specific student (shouldn't be needed for new students, but safe)
            $conn->prepare("DELETE FROM tbl_student_assigned WHERE student_id = ?")->execute([$studentId]);
            
            // Assign student to advisory
            $conn->prepare("INSERT INTO tbl_student_assigned (advisory_id, student_id) VALUES (?, ?)")->execute([$advisoryId, $studentId]);
            
            // Update gender counts for this advisory only
            $stmt = $conn->prepare("
                SELECT 
                    COUNT(CASE WHEN LOWER(s.stud_gender) = 'male' THEN 1 END) as male_count,
                    COUNT(CASE WHEN LOWER(s.stud_gender) = 'female' THEN 1 END) as female_count
                FROM tbl_student_assigned sa
                JOIN tbl_students s ON sa.student_id = s.student_id
                WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active'
            ");
            $stmt->execute([$advisoryId]);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Update advisory table with new counts
            $conn->prepare("UPDATE tbl_advisory SET total_male = ?, total_female = ?, total_students = ? WHERE advisory_id = ?")->execute([
                $counts['male_count'],
                $counts['female_count'],
                $counts['male_count'] + $counts['female_count'],
                $advisoryId
            ]);
        }
    }
    
    $conn->commit();

    // System logging for student creation - use direct SQL INSERT like login does
    try {
        $editorId = $data['editor_id'] ?? null; // Get the ID of the admin who created the student
        
        if ($editorId) {
            $action = 'Created a new student profile.';
            
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
            
            error_log("System log created successfully for student creation: User ID: $editorId, Action: $action, Target Student ID: $studentId");
        }
    } catch (Exception $logError) {
        // Don't fail the main operation if logging fails
        error_log("Failed to create system log for student creation: " . $logError->getMessage());
    }

    $response = [
        'status' => 'success',
        'message' => 'Student added successfully',
        'student_id' => $studentId,
        'user_id' => $studentId, // for logging as target_user_id
        'level_id' => $levelId,
        'default_photo' => $photo
    ];
    
    // Only include age if it was calculated (automatic mode)
    if ($age !== null) {
        $response['age'] = $age;
    }
    
    echo json_encode($response);
} catch (PDOException $e) {
    // Rollback transaction if active
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    
    // Log the specific error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in add_student.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Database error', 
        'error' => $e->getMessage(),
        'details' => 'Check error log for more information'
    ]);
} catch (Exception $e) {
    // Rollback transaction if active
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    
    // Log the specific error
    $errorMessage = date('Y-m-d H:i:s') . " - General error in add_student.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'message' => 'An error occurred', 
        'error' => $e->getMessage(),
        'details' => 'Check error log for more information'
    ]);
}
