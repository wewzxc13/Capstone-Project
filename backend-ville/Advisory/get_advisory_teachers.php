<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['advisory_ids'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing advisory_ids']);
    exit;
}

$advisory_ids = $data['advisory_ids'];

if (empty($advisory_ids) || !is_array($advisory_ids)) {
    echo json_encode(['status' => 'success', 'teachers' => []]);
    exit;
}

try {
    // Create placeholders for the IN clause
    $placeholders = str_repeat('?,', count($advisory_ids) - 1) . '?';
    
    // Query to get teacher information from advisory relationships
    $stmt = $conn->prepare("
        SELECT 
            a.advisory_id,
            CONCAT(u.user_lastname, ', ', u.user_firstname, ' ', COALESCE(u.user_middlename, '')) as teacher_name,
            u.user_id,
            u.user_firstname,
            u.user_middlename,
            u.user_lastname
        FROM tbl_advisory a
        LEFT JOIN tbl_users u ON (a.lead_teacher_id = u.user_id OR a.assistant_teacher_id = u.user_id)
        WHERE a.advisory_id IN ($placeholders) 
        AND u.user_role = 'Teacher'
    ");
    
    $stmt->execute($advisory_ids);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the results as advisory_id => teacher_name mapping
    $teachers = [];
    foreach ($results as $row) {
        // Use the first teacher found for each advisory (lead teacher takes priority)
        if (!isset($teachers[$row['advisory_id']])) {
            $teachers[$row['advisory_id']] = $row['teacher_name'];
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'teachers' => $teachers
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?>