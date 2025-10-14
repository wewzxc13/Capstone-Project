<?php
// Include CORS configuration
include_once 'cors_config.php';

header('Content-Type: application/json');

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

$input = json_decode(file_get_contents('php://input'), true);
$userIds = isset($input['user_ids']) && is_array($input['user_ids']) ? $input['user_ids'] : [];

if (empty($userIds)) {
    echo json_encode([]);
    exit();
}

$placeholders = implode(',', array_fill(0, count($userIds), '?'));
$sql = "SELECT u.user_id, CONCAT(u.user_firstname, ' ', u.user_middlename, ' ', u.user_lastname) AS full_name, r.role_name as role FROM tbl_users u LEFT JOIN tbl_roles r ON u.user_role = r.role_id WHERE u.user_id IN ($placeholders)";
$stmt = $conn->prepare($sql);
$stmt->execute($userIds);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

$userMap = [];
foreach ($results as $row) {
    $userMap[$row['user_id']] = [
        'full_name' => trim(preg_replace('/\s+/', ' ', $row['full_name'])),
        'role' => $row['role'] ?? 'Unknown'
    ];
}
echo json_encode($userMap); 