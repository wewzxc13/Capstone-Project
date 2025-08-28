<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

$advisory_id = isset($_GET['advisory_id']) ? $_GET['advisory_id'] : null;

if (!$advisory_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'advisory_id is required']);
    exit;
}

try {
    // Get all subjects that are used in the schedule for this advisory's level
    $stmt = $conn->prepare("
        SELECT DISTINCT sub.subject_id, sub.subject_name
        FROM tbl_advisory a
        JOIN tbl_schedule s ON a.level_id = s.level_id
        JOIN tbl_schedule_items si ON s.schedule_item_id = si.schedule_item_id
        JOIN tbl_subjects sub ON (si.subject_id = sub.subject_id OR si.subject_id_2 = sub.subject_id)
        WHERE a.advisory_id = ? AND sub.subject_name IS NOT NULL
        ORDER BY sub.subject_name
    ");
    
    $stmt->execute([$advisory_id]);
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'subjects' => $subjects
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