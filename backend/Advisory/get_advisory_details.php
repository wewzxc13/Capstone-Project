<?php
// Advisory details API - Returns only active users and students
// - Only active students (stud_school_status = 'Active') are returned
// - Only active teachers (user_status = 'Active') are returned
// - Only active parents (user_status = 'Active') are returned
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

// Check if database connection is available
if (!isset($conn) || $conn === null) {
    error_log("Database connection failed in get_advisory_details.php");
    http_response_code(500);
    echo json_encode([
        'message' => 'Database connection failed',
        'error' => 'Connection not available'
    ]);
    exit;
}

error_log("Database connection successful");
error_log("Database connection details: " . json_encode([
    'server_info' => $conn->getAttribute(PDO::ATTR_SERVER_VERSION),
    'connection_status' => $conn->getAttribute(PDO::ATTR_CONNECTION_STATUS),
    'driver_name' => $conn->getAttribute(PDO::ATTR_DRIVER_NAME)
]));

$input = file_get_contents("php://input");
error_log("Raw input received: " . $input);

if (!$input) {
    http_response_code(400);
    echo json_encode(['message' => 'No input data received']);
    exit;
}

$data = json_decode($input, true);
error_log("Parsed JSON data: " . json_encode($data));

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON decode error: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode([
        'message' => 'Invalid JSON data received',
        'json_error' => json_last_error_msg(),
        'raw_input' => $input
    ]);
    exit;
}

if (!$data || (!isset($data['teacher_id']) && !isset($data['level_id']) && !isset($data['student_id']))) {
    http_response_code(400);
    echo json_encode([
        'message' => 'teacher_id, level_id, or student_id is required',
        'received_data' => $data
    ]);
    exit;
}

if (isset($data['teacher_id'])) {
    $where = "(lead_teacher_id = ? OR assistant_teacher_id = ?)";
    $params = [$data['teacher_id'], $data['teacher_id']];
} elseif (isset($data['student_id'])) {
    // Find advisory by student_id through tbl_student_assigned
    $where = "a.advisory_id IN (SELECT advisory_id FROM tbl_student_assigned WHERE student_id = ?)";
    $params = [$data['student_id']];
} else {
    $where = "level_id = ?";
    $params = [$data['level_id']];
}

error_log("Where clause: " . $where);
error_log("Parameters: " . json_encode($params));

try {
    // Test basic table access first
    $test_stmt = $conn->prepare("SELECT COUNT(*) as count FROM tbl_advisory");
    $test_stmt->execute();
    $test_result = $test_stmt->fetch(PDO::FETCH_ASSOC);
    error_log("Advisory table count: " . $test_result['count']);
    
    // 1. Find advisory for this teacher or class
    $stmt = $conn->prepare("
        SELECT a.* FROM tbl_advisory a
        WHERE $where
        LIMIT 1
    ");
    
    // Log the query for debugging
    error_log("Executing advisory query with params: " . json_encode($params));
    
    $stmt->execute($params);
    $advisory = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$advisory) {
        // Log the issue for debugging
        $debug_info = [
            'teacher_id_requested' => $data['teacher_id'] ?? 'not provided',
            'where_clause' => $where,
            'params' => $params,
            'message' => 'No advisory found for this teacher'
        ];
        
        echo json_encode([
            'advisory' => null,
            'students' => [],
            'parents' => [],
            'debug_info' => $debug_info
        ]);
        exit;
    }

    $advisory_id = $advisory['advisory_id'];
    
    // Validate advisory_id
    if (!$advisory_id || !is_numeric($advisory_id)) {
        error_log("Invalid advisory_id: " . $advisory_id);
        http_response_code(400);
        echo json_encode([
            'message' => 'Invalid advisory ID',
            'debug_info' => [
                'advisory_id' => $advisory_id,
                'request_data' => $data
            ]
        ]);
        exit;
    }

    // Fetch lead and assistant teacher names and photos
    $lead_teacher_name = null;
    $assistant_teacher_name = null;
    $lead_teacher_photo = null;
    $assistant_teacher_photo = null;
    
    if (!empty($advisory['lead_teacher_id'])) {
        $stmt = $conn->prepare("SELECT user_firstname, user_middlename, user_lastname, user_photo FROM tbl_users WHERE user_id = ? AND user_status = 'Active'");
        $stmt->execute([$advisory['lead_teacher_id']]);
        $lead = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($lead) {
            $lead_teacher_name = trim($lead['user_firstname'] . ' ' . $lead['user_middlename'] . ' ' . $lead['user_lastname']);
            $lead_teacher_name = preg_replace('/\s+/', ' ', $lead_teacher_name);
            $lead_teacher_photo = $lead['user_photo'] ? 
                'http://localhost/capstone-project/backend/Uploads/' . $lead['user_photo'] : 
                'http://localhost/capstone-project/backend/Uploads/default_teacher.jpg';
        }
    }
    if (!empty($advisory['assistant_teacher_id'])) {
        $stmt = $conn->prepare("SELECT user_firstname, user_middlename, user_lastname, user_photo FROM tbl_users WHERE user_id = ? AND user_status = 'Active'");
        $stmt->execute([$advisory['assistant_teacher_id']]);
        $assistant = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($assistant) {
            $assistant_teacher_name = trim($assistant['user_firstname'] . ' ' . $assistant['user_middlename'] . ' ' . $assistant['user_lastname']);
            $assistant_teacher_name = preg_replace('/\s+/', ' ', $assistant_teacher_name);
            $assistant_teacher_photo = $assistant['user_photo'] ? 
                'http://localhost/capstone-project/backend/Uploads/' . $assistant['user_photo'] : 
                'http://localhost/capstone-project/backend/Uploads/default_teacher.jpg';
        }
    }
    // Add names and photos to advisory array
    $advisory['lead_teacher_name'] = $lead_teacher_name;
    $advisory['assistant_teacher_name'] = $assistant_teacher_name;
    $advisory['lead_teacher_photo'] = $lead_teacher_photo;
    $advisory['assistant_teacher_photo'] = $assistant_teacher_photo;

    // 2. Get active students that are specifically assigned to this advisory through tbl_student_assigned
    $stmt = $conn->prepare("
        SELECT s.student_id, s.stud_firstname, s.stud_middlename, s.stud_lastname, 
               s.stud_birthdate, s.stud_gender, s.stud_schedule_class, s.stud_school_status, 
               s.level_id, s.parent_id, s.stud_photo, s.stud_enrollment_date, s.stud_handedness
        FROM tbl_students s
        INNER JOIN tbl_student_assigned sa ON s.student_id = sa.student_id
        WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active'
        GROUP BY s.student_id
        ORDER BY s.stud_lastname, s.stud_firstname
    ");
    
    // Log the students query for debugging
    error_log("Executing students query for advisory_id: " . $advisory_id);
    
    $stmt->execute([$advisory_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: Log the actual students returned
    error_log("Students returned for advisory_id " . $advisory_id . ": " . count($students));
    error_log("Student IDs: " . json_encode(array_column($students, 'student_id')));
    error_log("Student names: " . json_encode(array_column($students, 'stud_firstname')));
    
    // Log the raw data to see if there are duplicates
    error_log("Raw students data: " . json_encode($students));
    
    // Remove any potential duplicates by student_id
    $unique_students = [];
    $seen_student_ids = [];
    
    foreach ($students as $student) {
        if (!in_array($student['student_id'], $seen_student_ids)) {
            $unique_students[] = $student;
            $seen_student_ids[] = $student['student_id'];
        } else {
            error_log("WARNING: Duplicate student_id " . $student['student_id'] . " found and removed");
        }
    }
    
    $students = $unique_students;
    error_log("After removing duplicates, students count: " . count($students));
    error_log("Final student IDs: " . json_encode(array_column($students, 'student_id')));
    error_log("Final students data: " . json_encode($students));
    
    // Create a copy of students array to avoid reference issues
    $students_for_processing = [];
    foreach ($students as $student) {
        $students_for_processing[] = [
            'student_id' => $student['student_id'],
            'stud_firstname' => $student['stud_firstname'],
            'stud_middlename' => $student['stud_middlename'],
            'stud_lastname' => $student['stud_lastname'],
            'stud_birthdate' => $student['stud_birthdate'],
            'stud_gender' => $student['stud_gender'],
            'stud_schedule_class' => $student['stud_schedule_class'],
            'stud_school_status' => $student['stud_school_status'],
            'level_id' => $student['level_id'],
            'parent_id' => $student['parent_id'],
            'stud_photo' => $student['stud_photo'],
            'stud_enrollment_date' => $student['stud_enrollment_date'],
            'stud_handedness' => $student['stud_handedness'],
            'advisory_id' => $advisory_id  // Add the advisory_id to each student
        ];
    }
    
    error_log("Students for processing count: " . count($students_for_processing));
    error_log("Students for processing IDs: " . json_encode(array_column($students_for_processing, 'student_id')));
    
    // Add photo field to students based on gender
    for ($i = 0; $i < count($students_for_processing); $i++) {
        $students_for_processing[$i]['photo'] = $students_for_processing[$i]['stud_photo'] ? 
            'http://localhost/capstone-project/backend/Uploads/' . $students_for_processing[$i]['stud_photo'] : 
            ($students_for_processing[$i]['stud_gender'] === 'Male' ? 
                'http://localhost/capstone-project/backend/Uploads/default_boy_student.jpg' : 
                'http://localhost/capstone-project/backend/Uploads/default_girl_student.jpg');
    }
    
    // Use the processed students array
    $students = $students_for_processing;
    
    error_log("After photo processing, students count: " . count($students));
    error_log("After photo processing, student IDs: " . json_encode(array_column($students, 'student_id')));

    // Calculate statistics from assigned students only
    $total_students = count($students);
    $total_male = 0;
    $total_female = 0;
    
    foreach ($students as $student) {
        if ($student['stud_gender'] === 'Male') {
            $total_male++;
        } elseif ($student['stud_gender'] === 'Female') {
            $total_female++;
        }
    }
    
    // Update advisory with correct statistics
    $advisory['total_students'] = $total_students;
    $advisory['total_male'] = $total_male;
    $advisory['total_female'] = $total_female;

    // 3. Get all unique parent_ids from assigned students
    $parent_ids = [];
    foreach ($students as $student) {
        if ($student['parent_id']) {
            $parent_ids[] = $student['parent_id'];
        }
    }
    
    // Debug: Log parent_id information
    error_log("Parent IDs found in students: " . json_encode($parent_ids));
    error_log("Students with parent_id: " . json_encode(array_filter($students, function($s) { return $s['parent_id']; })));
    error_log("Students without parent_id: " . json_encode(array_filter($students, function($s) { return !$s['parent_id']; })));
    
    $parents = [];
    if (count($parent_ids) > 0) {
        // Remove duplicates from parent_ids
        $parent_ids = array_unique($parent_ids);
        
        $in = str_repeat('?,', count($parent_ids) - 1) . '?';
        $stmt = $conn->prepare("SELECT * FROM tbl_users WHERE user_id IN ($in) AND user_status = 'Active'");
        $stmt->execute($parent_ids);
        $parents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Debug: Log parents found
        error_log("Parents found in database: " . count($parents));
        error_log("Parent data: " . json_encode($parents));
        
        // Add photo field to parents
        foreach ($parents as &$parent) {
            $parent['photo'] = $parent['user_photo'] ? 
                'http://localhost/capstone-project/backend/Uploads/' . $parent['user_photo'] : 
                'http://localhost/capstone-project/backend/Uploads/default_parent.jpg';
        }
        
        // Create a lookup array for parent information
        $parent_lookup = [];
        foreach ($parents as $parent) {
            $parent_lookup[$parent['user_id']] = $parent;
        }
        
        // Add parent name fields to students
        foreach ($students_for_processing as &$student) {
            if ($student['parent_id'] && isset($parent_lookup[$student['parent_id']])) {
                $parent = $parent_lookup[$student['parent_id']];
                $student['parent_firstname'] = $parent['user_firstname'];
                $student['parent_middlename'] = $parent['user_middlename'];
                $student['parent_lastname'] = $parent['user_lastname'];
            } else {
                $student['parent_firstname'] = null;
                $student['parent_middlename'] = null;
                $student['parent_lastname'] = null;
            }
        }
    } else {
        error_log("WARNING: No parent_ids found in students data!");
        
        // Set parent fields to null for all students
        foreach ($students_for_processing as &$student) {
            $student['parent_firstname'] = null;
            $student['parent_middlename'] = null;
            $student['parent_lastname'] = null;
        }
    }

    // Final debug: Log what we're about to return
    error_log("Final response for advisory_id $advisory_id:");
    error_log("- Advisory data: " . json_encode($advisory));
    error_log("- Students count: " . count($students));
    error_log("- Parents count: " . count($parents));
    error_log("- Students data: " . json_encode($students));
    error_log("- Parents data: " . json_encode($parents));
    
    echo json_encode([
        'advisory' => $advisory,
        'students' => $students,
        'parents' => $parents
    ]);
} catch (PDOException $e) {
    // Log the error for debugging
    error_log("Database error in get_advisory_details.php: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    error_log("Request data: " . json_encode($data));
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Database error occurred', 
        'error' => $e->getMessage(),
        'sql_state' => $e->getCode(),
        'request_data' => $data,
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
} catch (Exception $e) {
    // Log any other errors for debugging
    error_log("General error in get_advisory_details.php: " . $e->getMessage());
    error_log("Request data: " . json_encode($data));
    
    http_response_code(500);
    echo json_encode([
        'message' => 'An error occurred', 
        'error' => $e->getMessage(),
        'request_data' => $data,
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
} catch (Throwable $e) {
    // Catch any other errors including fatal errors
    http_response_code(500);
    echo json_encode([
        'message' => 'Fatal error occurred',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
