<?php
// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Get parent_id from query parameters
$parentId = isset($_GET['parent_id']) ? intval($_GET['parent_id']) : 0;

if ($parentId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Valid parent_id is required']);
    exit;
}

try {
    // Check database connection
    if (!$conn) {
        throw new Exception('Database connection failed. Please check your database configuration.');
    }
    
    // Get all students for this parent - simplified query without JOIN
    $stmt = $conn->prepare("
        SELECT 
            student_id,
            stud_firstname,
            stud_middlename,
            stud_lastname,
            stud_birthdate,
            stud_enrollment_date,
            stud_handedness,
            stud_gender,
            stud_schedule_class,
            stud_photo,
            stud_school_status,
            level_id
        FROM tbl_students 
        WHERE parent_id = ? 
        ORDER BY stud_firstname, stud_lastname
    ");
    
    $stmt->execute([$parentId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate counts
    $totalChildren = count($students);
    $activeStudents = count(array_filter($students, function($student) {
        return $student['stud_school_status'] === 'Active';
    }));
    
    // Get additional statistics
    $stmt = $conn->prepare("
        SELECT 
            COUNT(CASE WHEN stud_gender = 'Male' THEN 1 END) as male_count,
            COUNT(CASE WHEN stud_gender = 'Female' THEN 1 END) as female_count,
            COUNT(CASE WHEN stud_school_status = 'Active' THEN 1 END) as active_count,
            COUNT(CASE WHEN stud_school_status = 'Inactive' THEN 1 END) as inactive_count
        FROM tbl_students 
        WHERE parent_id = ?
    ");
    
    $stmt->execute([$parentId]);
    $statistics = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Format student data for frontend
    $formattedStudents = array_map(function($student) {
        return [
            'student_id' => $student['student_id'],
            'first_name' => $student['stud_firstname'],
            'middle_name' => $student['stud_middlename'],
            'last_name' => $student['stud_lastname'],
            'full_name' => trim($student['stud_firstname'] . ' ' . 
                               ($student['stud_middlename'] ? $student['stud_middlename'] . ' ' : '') . 
                               $student['stud_lastname']),
            'birthdate' => $student['stud_birthdate'],
            'enrollment_date' => $student['stud_enrollment_date'],
            'handedness' => $student['stud_handedness'],
            'gender' => $student['stud_gender'],
            'schedule_class' => $student['stud_schedule_class'],
            'photo' => $student['stud_photo'],
            'school_status' => $student['stud_school_status'],
            'level_id' => $student['level_id'],
            'level_name' => 'Grade ' . $student['level_id'],
            'level_description' => 'Level ' . $student['level_id'],
            'age' => $student['stud_birthdate'] ? calculateAge($student['stud_birthdate']) : null
        ];
    }, $students);
    
    // Prepare response
    $response = [
        'status' => 'success',
        'data' => [
            'parent_id' => $parentId,
            'total_children' => $totalChildren,
            'active_students' => $activeStudents,
            'statistics' => [
                'male_count' => intval($statistics['male_count']),
                'female_count' => intval($statistics['female_count']),
                'active_count' => intval($statistics['active_count']),
                'inactive_count' => intval($statistics['inactive_count'])
            ],
            'students' => $formattedStudents
        ]
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    // Log the error for debugging
    error_log("Parent Students API PDO Error: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error occurred',
        'error' => $e->getMessage(),
        'sql_state' => $e->getCode()
    ]);
} catch (Exception $e) {
    // Log the error for debugging
    error_log("Parent Students API General Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'An error occurred',
        'error' => $e->getMessage()
    ]);
}

/**
 * Calculate age from birthdate
 */
function calculateAge($birthdate) {
    $birth = new DateTime($birthdate);
    $today = new DateTime();
    $age = $today->diff($birth);
    return $age->y;
}
?>
