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
$studentIds = isset($input['student_ids']) && is_array($input['student_ids']) ? $input['student_ids'] : [];

if (empty($studentIds)) {
    echo json_encode([]);
    exit();
}

$placeholders = implode(',', array_fill(0, count($studentIds), '?'));
$sql = "SELECT student_id, CONCAT(stud_firstname, ' ', stud_middlename, ' ', stud_lastname) AS full_name FROM tbl_students WHERE student_id IN ($placeholders)";
$stmt = $conn->prepare($sql);
$stmt->execute($studentIds);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

$nameMap = [];
foreach ($results as $row) {
    $nameMap[$row['student_id']] = trim(preg_replace('/\s+/', ' ', $row['full_name']));
}
echo json_encode($nameMap); 