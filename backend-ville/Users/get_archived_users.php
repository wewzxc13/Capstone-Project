<?php
// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Only GET requests are allowed']);
    exit;
}

try {
    $response = [
        'status' => 'success',
        'users' => [
            'Admin' => [],
            'Teacher' => [],
            'Parent' => [],
            'Student' => []
        ]
    ];

    // Get all inactive users with their roles
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_middlename,
            u.user_lastname,
            u.user_email,
            u.user_contact_no,
            u.user_birthdate,
            u.user_status,
            u.user_role,
            u.user_photo,
            r.role_name
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Inactive'
        ORDER BY r.role_name, u.user_lastname, u.user_firstname
    ");
    
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as $user) {
        // Construct full name
        $fullName = trim($user['user_firstname'] . ' ' . $user['user_middlename'] . ' ' . $user['user_lastname']);
        $fullName = preg_replace('/\s+/', ' ', $fullName); // Remove extra spaces

        $userData = [
            'id' => $user['user_id'],
            'name' => $fullName,
            'firstName' => $user['user_firstname'],
            'middleName' => $user['user_middlename'],
            'lastName' => $user['user_lastname'],
            'email' => $user['user_email'],
            'contactNo' => $user['user_contact_no'],
            'birthdate' => $user['user_birthdate'],
            'status' => $user['user_status'],
            'role' => $user['role_name'] ?? 'Unknown Role',
            'photo' => $user['user_photo'] ? $user['user_photo'] : null
        ];

        // Add user to appropriate role group
        $roleName = $user['role_name'] ?? 'Unknown Role';
        if (isset($response['users'][$roleName])) {
            $response['users'][$roleName][] = $userData;
        }
    }

    // Get all inactive students from tbl_students
    try {
        // First try with student levels table
        $stmt = $conn->prepare("
            SELECT 
                s.student_id,
                s.stud_firstname,
                s.stud_middlename,
                s.stud_lastname,
                s.stud_birthdate,
                s.stud_gender,
                s.stud_schedule_class,
                s.stud_school_status,
                s.level_id,
                sl.level_name,
                s.parent_id,
                s.stud_photo
            FROM tbl_students s
            LEFT JOIN tbl_student_levels sl ON s.level_id = sl.level_id
            WHERE s.stud_school_status = 'Inactive'
            ORDER BY s.stud_lastname, s.stud_firstname
        ");
        
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // If student levels table doesn't exist, try without it
        $stmt = $conn->prepare("
            SELECT 
                s.student_id,
                s.stud_firstname,
                s.stud_middlename,
                s.stud_lastname,
                s.stud_birthdate,
                s.stud_gender,
                s.stud_schedule_class,
                s.stud_school_status,
                s.level_id,
                NULL as level_name,
                s.parent_id,
                s.stud_photo
            FROM tbl_students s
            WHERE s.stud_school_status = 'Inactive'
            ORDER BY s.stud_lastname, s.stud_firstname
        ");
        
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    foreach ($students as $student) {
        // Construct full name
        $fullName = trim($student['stud_firstname'] . ' ' . $student['stud_middlename'] . ' ' . $student['stud_lastname']);
        $fullName = preg_replace('/\s+/', ' ', $fullName); // Remove extra spaces

        // Determine level name based on level_id if level_name is null
        $levelName = $student['level_name'];
        if (!$levelName && $student['level_id']) {
            switch ($student['level_id']) {
                case 1:
                    $levelName = 'Age 2';
                    break;
                case 2:
                    $levelName = 'Age 3';
                    break;
                case 3:
                    $levelName = 'Age 4';
                    break;
                default:
                    $levelName = 'Unknown Level';
            }
        }

        $studentData = [
            'id' => $student['student_id'],
            'name' => $fullName,
            'firstName' => $student['stud_firstname'],
            'middleName' => $student['stud_middlename'],
            'lastName' => $student['stud_lastname'],
            'birthdate' => $student['stud_birthdate'],
            'gender' => $student['stud_gender'],
            'scheduleClass' => $student['stud_schedule_class'],
            'schoolStatus' => $student['stud_school_status'],
            'levelId' => $student['level_id'],
            'levelName' => $levelName,
            'parent_id' => $student['parent_id'],
            'role' => 'Student',
            'photo' => $student['stud_photo'] ? $student['stud_photo'] : null
        ];

        $response['users']['Student'][] = $studentData;
    }

    echo json_encode($response);

} catch (PDOException $e) {
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_archived_users.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 