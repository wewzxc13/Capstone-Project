<?php
// CORS headers are handled in connection.php which supports production domains
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
    // First, let's check if the user exists without the role join
    $stmtBasic = $conn->prepare("
        SELECT 
            user_id,
            user_firstname,
            user_middlename,
            user_lastname,
            user_email,
            user_contact_no,
            user_status,
            user_role
        FROM tbl_users 
        WHERE user_id = ?
    ");
    
    $stmtBasic->execute([$userId]);
    $userBasic = $stmtBasic->fetch(PDO::FETCH_ASSOC);

    if (!$userBasic) {
        http_response_code(404);
        echo json_encode([
            'message' => 'User not found',
            'debug' => 'User ID ' . $userId . ' does not exist in tbl_users'
        ]);
        exit;
    }

    // Now let's check the roles table
    $stmtRoles = $conn->prepare("SELECT role_id, role_name FROM tbl_roles");
    $stmtRoles->execute();
    $allRoles = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);

    // Try to get user with role join
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_middlename,
            u.user_lastname,
            u.user_email,
            u.user_contact_no,
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
        echo json_encode([
            'message' => 'User not found or inactive',
            'debug' => [
                'user_basic' => $userBasic,
                'user_role_id' => $userBasic['user_role'],
                'all_roles' => $allRoles
            ]
        ]);
        exit;
    }

    // Construct full name
    $fullName = trim($user['user_firstname'] . ' ' . $user['user_middlename'] . ' ' . $user['user_lastname']);
    $fullName = preg_replace('/\s+/', ' ', $fullName); // Remove extra spaces

    echo json_encode([
        'status' => 'success',
        'user' => [
            'id' => $user['user_id'],
            'firstName' => $user['user_firstname'],
            'middleName' => $user['user_middlename'],
            'lastName' => $user['user_lastname'],
            'fullName' => $fullName,
            'email' => $user['user_email'],
            'contactNo' => $user['user_contact_no'],
            'role' => $user['role_name'] ?? 'Unknown Role',
            'status' => $user['user_status']
        ],
        'debug' => [
            'user_role_id' => $user['user_role'],
            'role_name_found' => $user['role_name'] ?? 'NULL',
            'all_roles_in_db' => $allRoles
        ]
    ]);

} catch (PDOException $e) {
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_user_details_debug.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'message' => 'Database error', 
        'error' => $e->getMessage(),
        'debug' => 'Check error log for more information'
    ]);
}
?> 