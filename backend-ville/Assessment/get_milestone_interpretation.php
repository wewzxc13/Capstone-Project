<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
if (!$student_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing student_id']);
    exit;
}

$stmt = $conn->prepare('SELECT * FROM tbl_student_milestone_interpretation WHERE student_id = ? ORDER BY milestone_id DESC LIMIT 1');
$stmt->execute([$student_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    echo json_encode(['status' => 'success', 'milestone' => $row]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No milestone interpretation found']);
} 