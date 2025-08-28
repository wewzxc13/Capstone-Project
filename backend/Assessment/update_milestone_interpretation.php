<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Only POST requests are allowed."]);
    exit;
}
$data = json_decode(file_get_contents('php://input'), true);
$milestone_id = $data['milestone_id'] ?? null;
$summary = $data['summary'] ?? null;
$overall_summary = $data['overall_summary'] ?? null;
if (!$milestone_id) {
    echo json_encode(["status" => "error", "message" => "Missing milestone_id."]);
    exit;
}
$stmt = $conn->prepare('UPDATE tbl_student_milestone_interpretation SET summary = ?, overall_summary = ?, recorded_at = NOW() WHERE milestone_id = ?');
$ok = $stmt->execute([$summary, $overall_summary, $milestone_id]);
if ($ok) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update milestone interpretation."]);
} 