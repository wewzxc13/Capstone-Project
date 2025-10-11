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

try {
    // Get all teachers not assigned as lead or assistant in any advisory
    $stmt = $conn->prepare('
        SELECT u.user_id, u.user_firstname, u.user_lastname, u.user_email
        FROM tbl_users u
        LEFT JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE r.role_name = "Teacher"
        AND u.user_status = "Active"
        AND u.user_id NOT IN (
            SELECT lead_teacher_id FROM tbl_advisory WHERE lead_teacher_id IS NOT NULL
            UNION
            SELECT assistant_teacher_id FROM tbl_advisory WHERE assistant_teacher_id IS NOT NULL
        )
        ORDER BY u.user_lastname, u.user_firstname
    ');
    $stmt->execute();
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result = array_map(function($t) {
        return [
            'id' => $t['user_id'],
            'firstName' => $t['user_firstname'],
            'lastName' => $t['user_lastname'],
            'email' => $t['user_email']
        ];
    }, $teachers);
    echo json_encode(['status' => 'success', 'teachers' => $result]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 