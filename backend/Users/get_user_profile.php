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
    // Fetch basic user details with role name
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
            r.role_name
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_id = ? AND u.user_status = 'Active'
    ");
    
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['message' => 'User not found or inactive']);
        exit;
    }

    $userRole = $user['user_role'];
    $response = [
        'status' => 'success',
        'user' => [
            'user_id' => $user['user_id'],
            'user_firstname' => $user['user_firstname'],
            'user_middlename' => $user['user_middlename'],
            'user_lastname' => $user['user_lastname'],
            'user_email' => $user['user_email'],
            'user_contact_no' => $user['user_contact_no'],
            'user_birthdate' => $user['user_birthdate'],
            'role' => $user['role_name'],
            'user_status' => $user['user_status']
        ]
    ];

    // Fetch additional information based on user role
    if ($userRole == 2 || $userRole == 3) { // Admin or Teacher
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
        // Get address and parent details from tbl_parents_profile
        $stmt = $conn->prepare("
            SELECT 
                barangay,
                city_municipality,
                province,
                country,
                father_name,
                father_age,
                father_occupation,
                mother_name,
                mother_age,
                mother_occupation
            FROM tbl_parents_profile 
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $parentInfo = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($parentInfo) {
            $response['user']['barangay'] = $parentInfo['barangay'];
            $response['user']['city'] = $parentInfo['city_municipality'];
            $response['user']['province'] = $parentInfo['province'];
            $response['user']['country'] = $parentInfo['country'];
            $response['user']['father_name'] = $parentInfo['father_name'];
            $response['user']['father_age'] = $parentInfo['father_age'];
            $response['user']['father_occupation'] = $parentInfo['father_occupation'];
            $response['user']['mother_name'] = $parentInfo['mother_name'];
            $response['user']['mother_age'] = $parentInfo['mother_age'];
            $response['user']['mother_occupation'] = $parentInfo['mother_occupation'];
        }
    }

    echo json_encode($response);

} catch (PDOException $e) {
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_user_profile.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 