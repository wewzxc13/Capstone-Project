<?php
// CORS Configuration - Allow production and development origins
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins
$allowedOrigins = [
    'https://learnersville.online',
    'https://www.learnersville.online',
    'https://capstone-project-chi-seven.vercel.app',
    'http://localhost:3000',
];

// Check if origin matches localhost:3XXX pattern
if (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (preg_match('/^https:\/\/.*\.vercel\.app$/', $origin)) {
    // Allow any Vercel preview deployment
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default fallback for development
    header("Access-Control-Allow-Origin: http://localhost:3000");
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
    // Note: Student count only includes students linked to parents (consistent with Report pages)
    $response = [
        'status' => 'success',
        'counts' => [
            'admin' => 0,
            'teachers' => 0,
            'parents' => 0,
            'students' => 0
        ]
    ];

    // Get active admin count
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Active' AND r.role_name = 'Admin'
    ");
    $stmt->execute();
    $adminCount = $stmt->fetch(PDO::FETCH_ASSOC);
    $response['counts']['admin'] = (int)$adminCount['count'];

    // Get active teachers count
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Active' AND r.role_name = 'Teacher'
    ");
    $stmt->execute();
    $teacherCount = $stmt->fetch(PDO::FETCH_ASSOC);
    $response['counts']['teachers'] = (int)$teacherCount['count'];

    // Get active parents count
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_status = 'Active' AND r.role_name = 'Parent'
    ");
    $stmt->execute();
    $parentCount = $stmt->fetch(PDO::FETCH_ASSOC);
    $response['counts']['parents'] = (int)$parentCount['count'];

    // Get active students count (only students linked to parents)
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM tbl_students
        WHERE stud_school_status = 'Active' AND parent_id IS NOT NULL
    ");
    $stmt->execute();
    $studentCount = $stmt->fetch(PDO::FETCH_ASSOC);
    $response['counts']['students'] = (int)$studentCount['count'];

    echo json_encode($response);

} catch (PDOException $e) {
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_user_counts.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 