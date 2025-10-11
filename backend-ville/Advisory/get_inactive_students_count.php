<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

$level_id = isset($_GET['level_id']) ? intval($_GET['level_id']) : null;

if (!$level_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'level_id is required']);
    exit;
}

try {
    // Count inactive students WITH parent linking in this level
    $stmt = $conn->prepare("
        SELECT COUNT(*) as inactive_count
        FROM tbl_students s
        WHERE s.level_id = ? 
        AND s.stud_school_status = 'Inactive' 
        AND s.parent_id IS NOT NULL
    ");
    $stmt->execute([$level_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'inactive_count' => (int)$result['inactive_count'],
        'level_id' => $level_id
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
}
?>
