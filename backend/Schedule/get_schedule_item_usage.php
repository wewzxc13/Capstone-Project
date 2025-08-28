<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only GET requests are allowed']);
    exit;
}

try {
    // Get all subject IDs that are currently in use
    $stmt = $conn->prepare("
        SELECT DISTINCT subject_id as id FROM tbl_schedule_items 
        WHERE subject_id IS NOT NULL 
        UNION 
        SELECT DISTINCT subject_id_2 as id FROM tbl_schedule_items 
        WHERE subject_id_2 IS NOT NULL
    ");
    $stmt->execute();
    $used_subject_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Get all routine IDs that are currently in use
    $stmt = $conn->prepare("
        SELECT DISTINCT routine_id as id FROM tbl_schedule_items 
        WHERE routine_id IS NOT NULL 
        UNION 
        SELECT DISTINCT routine_id_2 as id FROM tbl_schedule_items 
        WHERE routine_id_2 IS NOT NULL
    ");
    $stmt->execute();
    $used_routine_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'used_subject_ids' => $used_subject_ids,
            'used_routine_ids' => $used_routine_ids
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 