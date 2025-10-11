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

// Extract shared fields
$role           = strtolower(trim($data['user_type'] ?? ''));
$firstname      = trim($data['first_name'] ?? '');
$middlename     = trim($data['middle_name'] ?? '');
$lastname       = trim($data['last_name'] ?? '');
$birthdate      = trim($data['dob'] ?? '');
$email          = trim($data['email'] ?? '');
$contact        = trim($data['contact'] ?? '');
$photo          = trim($data['user_photo'] ?? '');
$city           = trim($data['city'] ?? '');
$province       = trim($data['province'] ?? '');
$country        = trim($data['country'] ?? '');
$barangay       = trim($data['barangay'] ?? '');

// Handle region field by mapping it to country
$region = trim($data['region'] ?? '');
if ($region && !$country) {
    $country = $region; // Use region as country if country is not provided
}

// Government IDs
$tin            = trim($data['tin'] ?? '');
$sss            = trim($data['sss'] ?? '');
$pagibig        = trim($data['pagibig'] ?? '');

// Set default photo if none uploaded
if (!$photo) {
    // Assign default photo based on user type
    if ($role === 'admin') {
        $photo = 'default_admin.png';
    } else if ($role === 'teacher') {
        $photo = 'default_teacher.png';
    } else if ($role === 'parent') {
        $photo = 'default_parent.png';
    } else {
        $photo = 'default_photo.jpg'; // fallback
    }
}

$defaultPassword = 'Learnersville';
$hashedPassword  = password_hash($defaultPassword, PASSWORD_BCRYPT);

// Validate required fields
if (!$firstname || !$lastname || !$birthdate || !$email || !$barangay || !$city || !$province || !$country) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields: firstname, lastname, birthdate, email, barangay, city, province, and country are required']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid email format']);
    exit;
}

// Validate birthdate format and age requirement (18+ years old)
$birthdateObj = DateTime::createFromFormat('Y-m-d', $birthdate);
if (!$birthdateObj || $birthdateObj->format('Y-m-d') !== $birthdate) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid birthdate format. Use YYYY-MM-DD']);
    exit;
}

// Check if user is 18 years or older
$today = new DateTime();
$age = $today->diff($birthdateObj)->y;
if ($age < 18) {
    http_response_code(400);
    echo json_encode(['message' => 'User must be 18 years or older. Current age: ' . $age . ' years']);
    exit;
}

// Check for unique email before inserting
if ($email) {
    $stmt = $conn->prepare("SELECT user_id FROM tbl_users WHERE user_email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['message' => 'Email already exists. Please use a different email.']);
        exit;
    }
}

try {
    $conn->beginTransaction();

    // Map role to numeric user_role
    $roleMap = ['admin' => 2, 'teacher' => 3, 'parent' => 4];
    $userRole = $roleMap[$role] ?? null;

    if (!$userRole) {
        throw new Exception('Invalid role specified.');
    }

    // Insert into tbl_users
    $stmt = $conn->prepare("INSERT INTO tbl_users (
        user_role, user_pass, user_firstname, user_middlename, user_lastname, user_birthdate,
        user_email, user_contact_no, user_photo, user_status, is_new
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'Yes'
    )");

    $stmt->execute([
        $userRole,
        $hashedPassword,
        $firstname,
        $middlename,
        $lastname,
        $birthdate,
        $email,
        $contact,
        $photo
    ]);

    $user_id = $conn->lastInsertId();

    // Admin & Teacher: Insert into tbl_add_info with address + gov IDs
    if (in_array($role, ['admin', 'teacher'])) {
        $stmt2 = $conn->prepare("INSERT INTO tbl_add_info (
            user_id, tin_number, sss_number, pagibig_number, barangay, city_municipality, province, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt2->execute([$user_id, $tin, $sss, $pagibig, $barangay, $city, $province, $country]);
    }

    // Parent: Insert into tbl_parents_profile with address only
    if ($role === 'parent') {
        $stmt3 = $conn->prepare("INSERT INTO tbl_parents_profile (
            user_id, barangay, city_municipality, province, country
        ) VALUES (?, ?, ?, ?, ?)");

        $stmt3->execute([$user_id, $barangay, $city, $province, $country]);
    }

    $conn->commit();

    // System logging for user creation
    try {
        $editorId = $data['editor_id'] ?? null; // Get the ID of the super admin who created the user
        
        if ($editorId) {
            $action = '';
            switch ($role) {
                case 'admin':
                    $action = 'Created a new admin account.';
                    break;
                case 'teacher':
                    $action = 'Created a new teacher account.';
                    break;
                case 'parent':
                    $action = 'Created a new parent account.';
                    break;
            }
            
            if ($action) {
                $logData = [
                    'user_id' => $editorId,
                    'target_user_id' => $user_id,
                    'target_student_id' => null,
                    'action' => $action
                ];
                
                $logResponse = file_get_contents(__DIR__ . '/../Logs/create_system_log.php', false, stream_context_create([
                    'http' => [
                        'method' => 'POST',
                        'header' => 'Content-Type: application/json',
                        'content' => json_encode($logData)
                    ]
                ]));
                
                // Log the system log creation attempt for debugging
                error_log("System log creation attempt for user creation: " . $logResponse);
            }
        }
    } catch (Exception $logError) {
        // Don't fail the main operation if logging fails
        error_log("Failed to create system log for user creation: " . $logError->getMessage());
    }

    // Use $user_id from the main tbl_users insert
    echo json_encode([
        'status' => 'success',
        'message' => ucfirst($role) . ' user added successfully',
        'user_id' => $user_id,
        'default_password' => $defaultPassword,
        'default_photo' => $photo
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
}
