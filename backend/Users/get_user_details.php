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

// Check if there was a connection error
if (isset($connection_error)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $connection_error
    ]);
    exit;
}

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

$userId = intval($data['user_id']);

try {
    // Try to fetch from tbl_users first
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
        WHERE u.user_id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Construct full name
        $fullName = trim($user['user_firstname'] . ' ' . $user['user_middlename'] . ' ' . $user['user_lastname']);
        $fullName = preg_replace('/\s+/', ' ', $fullName); // Remove extra spaces

        // Handle missing role name
        $roleName = $user['role_name'] ?? 'Unknown Role';

        $response = [
            'status' => 'success',
            'user' => [
                'id' => $user['user_id'],
                'firstName' => $user['user_firstname'],
                'middleName' => $user['user_middlename'],
                'lastName' => $user['user_lastname'],
                'fullName' => $fullName,
                'email' => $user['user_email'],
                'contactNo' => $user['user_contact_no'],
                'user_birthdate' => $user['user_birthdate'],
                'role' => $roleName,
                'status' => $user['user_status'],
                'photo' => $user['user_photo'] ? $user['user_photo'] : null
            ]
        ];

        // Debug log for parent retrieval
        $debugMessage = date('Y-m-d H:i:s') . " - Retrieved parent user_id {$user['user_id']}: " . json_encode($response['user']) . "\n";
        file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

        // Fetch additional information based on user role
        $userRole = $user['user_role'];
        
        if ($userRole == 1 || $userRole == 2 || $userRole == 3) { // Super Admin, Admin, or Teacher
            // Get address and government IDs from tbl_add_info
            $stmt = $conn->prepare("
                SELECT 
                    tin_number,
                    sss_number,
                    pagibig_number,
                    barangay,
                    city_municipality,
                    province,
                    country
                FROM tbl_add_info 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $addInfo = $stmt->fetch(PDO::FETCH_ASSOC);

            // Debug log
            $debugMessage = date('Y-m-d H:i:s') . " - User ID $userId (Admin/Teacher/SuperAdmin) - tbl_add_info data: " . json_encode($addInfo) . "\n";
            file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

            if ($addInfo) {
                $response['user']['tin_number'] = $addInfo['tin_number'];
                $response['user']['sss_number'] = $addInfo['sss_number'];
                $response['user']['pagibig_number'] = $addInfo['pagibig_number'];
                $response['user']['barangay'] = $addInfo['barangay'];
                $response['user']['city'] = $addInfo['city_municipality'];
                $response['user']['province'] = $addInfo['province'];
                $response['user']['country'] = $addInfo['country'];
            }
        } elseif ($userRole == 4) { // Parent
            // Get address and parent_profile_id from tbl_parents_profile
            $stmt = $conn->prepare("
                SELECT 
                    parent_profile_id,
                    barangay,
                    city_municipality,
                    province,
                    country
                FROM tbl_parents_profile 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $parentInfo = $stmt->fetch(PDO::FETCH_ASSOC);

            // Debug log
            $debugMessage = date('Y-m-d H:i:s') . " - User ID $userId (Parent) - tbl_parents_profile data: " . json_encode($parentInfo) . "\n";
            file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

            if ($parentInfo) {
                $response['user']['parent_profile_id'] = $parentInfo['parent_profile_id'];
                $response['user']['barangay'] = $parentInfo['barangay'];
                $response['user']['city'] = $parentInfo['city_municipality'];
                $response['user']['province'] = $parentInfo['province'];
                $response['user']['country'] = $parentInfo['country'];
            }
        }

        echo json_encode($response);
        exit;
    }

    // If not found in tbl_users, try tbl_students
    $stmt = $conn->prepare("
        SELECT 
            s.student_id,
            s.stud_firstname,
            s.stud_middlename,
            s.stud_lastname,
            s.stud_birthdate,
            s.stud_gender,
            s.stud_handedness,
            s.stud_schedule_class,
            s.stud_photo,
            s.stud_school_status,
            s.level_id,
            s.parent_id,
            s.stud_enrollment_date,
            s.barangay,
            s.city_municipality as city,
            s.province,
            s.country
        FROM tbl_students s
        WHERE s.student_id = ?
    ");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($student) {
        $fullName = trim($student['stud_firstname'] . ' ' . $student['stud_middlename'] . ' ' . $student['stud_lastname']);
        $fullName = preg_replace('/\s+/', ' ', $fullName);
        $response = [
            'status' => 'success',
            'user' => [
                'id' => $student['student_id'],
                'firstName' => $student['stud_firstname'],
                'middleName' => $student['stud_middlename'],
                'lastName' => $student['stud_lastname'],
                'fullName' => $fullName,
                'user_birthdate' => $student['stud_birthdate'],
                'gender' => $student['stud_gender'],
                'handedness' => $student['stud_handedness'],
                'scheduleClass' => $student['stud_schedule_class'],
                'photo' => $student['stud_photo'],
                'schoolStatus' => $student['stud_school_status'],
                'levelId' => $student['level_id'],
                'parentId' => $student['parent_id'],
                'enrollmentDate' => $student['stud_enrollment_date'],
                'barangay' => $student['barangay'],
                'city' => $student['city'],
                'province' => $student['province'],
                'country' => $student['country'],
                'role' => 'Student',
            ]
        ];
        echo json_encode($response);
        exit;
    }

    // If not found in either, return not found
    http_response_code(404);
    echo json_encode(['message' => 'User or student not found or inactive']);
    exit;

} catch (PDOException $e) {
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_user_details.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 