<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

try {
    $stmt = $conn->prepare('SELECT quarter_id, quarter_name, start_date, end_date FROM tbl_quarters ORDER BY quarter_id ASC');
    $stmt->execute();
    $quarters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($quarters);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 