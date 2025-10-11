<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$advisory_id = isset($_GET['advisory_id']) ? $_GET['advisory_id'] : null;

if (!$student_id || !$advisory_id) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters: student_id, advisory_id"]);
    exit;
}

$stmt = $conn->prepare('SELECT * FROM tbl_progress_cards WHERE student_id = ? AND advisory_id = ? AND is_finalized = 1');
$stmt->execute([$student_id, $advisory_id]);
$cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status" => "success",
    "cards" => $cards
]); 