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
    exit;
}

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

    // Get all active users with their roles (status = 'active')
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
            r.role_name,
            p.parent_profile_id
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        LEFT JOIN tbl_parents_profile p ON u.user_id = p.user_id
        WHERE TRIM(LOWER(u.user_status)) = 'active'
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
            'photo' => $user['user_photo'] ? 'http://localhost/capstone-project/backend/Uploads/' . $user['user_photo'] : 
                     (($user['role_name'] === 'Admin') ? 'http://localhost/capstone-project/backend/Uploads/default_admin.png' :
                      (($user['role_name'] === 'Teacher') ? 'http://localhost/capstone-project/backend/Uploads/default_teacher.png' :
                      (($user['role_name'] === 'Parent') ? 'http://localhost/capstone-project/backend/Uploads/default_parent.png' : null)))
        ];
        // Only add parent_profile_id for parents
        if ($user['role_name'] === 'Parent') {
            $userData['parent_profile_id'] = isset($user['parent_profile_id']) ? $user['parent_profile_id'] : null;
        }
        // Add user to appropriate role group
        $roleName = $user['role_name'] ?? 'Unknown Role';
        if (isset($response['users'][$roleName])) {
            $response['users'][$roleName][] = $userData;
        }
    }

    // Get all active students from tbl_students (stud_school_status = 'Active')
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
            WHERE TRIM(LOWER(s.stud_school_status)) = 'active'
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
            WHERE TRIM(LOWER(s.stud_school_status)) = 'active'
            ORDER BY s.stud_lastname, s.stud_firstname
        ");
        
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    foreach ($students as $student) {
        // Construct full name
        $fullName = trim($student['stud_firstname'] . ' ' . $student['stud_middlename'] . ' ' . $student['stud_lastname']);
        $fullName = preg_replace('/\s+/', ' ', $fullName); // Remove extra spaces

        // Check if student is assigned to an advisory
        $stmt = $conn->prepare("
            SELECT a.level_id 
            FROM tbl_advisory a
            JOIN tbl_student_assigned sa ON a.advisory_id = sa.advisory_id
            WHERE sa.student_id = ?
        ");
        $stmt->execute([$student['student_id']]);
        $advisoryAssignment = $stmt->fetch(PDO::FETCH_ASSOC);

        // Determine class name based on parent_id and advisory assignment or level_id
        $className = "Not Assigned Yet";
        
        // Only set class name if student has a parent linked
        if ($student['parent_id']) {
            if ($advisoryAssignment && $advisoryAssignment['level_id']) {
                switch ($advisoryAssignment['level_id']) {
                    case 1:
                        $className = "Discoverer";
                        break;
                    case 2:
                        $className = "Explorer";
                        break;
                    case 3:
                        $className = "Adventurer";
                        break;
                    default:
                        $className = "Not assigned yet";
                }
            } else {
                switch ($student['level_id']) {
                    case 1:
                        $className = "Discoverer";
                        break;
                    case 2:
                        $className = "Explorer";
                        break;
                    case 3:
                        $className = "Adventurer";
                        break;
                    default:
                        $className = "Not assigned yet";
                }
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
            'levelName' => $className,
            'role' => 'Student',
            'parent_id' => $student['parent_id'] ?? null,
            'photo' => $student['stud_photo'] ? 
                'http://localhost/capstone-project/backend/Uploads/' . $student['stud_photo'] : 
                ($student['stud_gender'] === 'Male' ? 'http://localhost/capstone-project/backend/Uploads/default_boy_student.png' : 'http://localhost/capstone-project/backend/Uploads/default_girl_student.png')
        ];

        $response['users']['Student'][] = $studentData;
    }

    echo json_encode($response);

} catch (PDOException $e) {
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_all_users.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 