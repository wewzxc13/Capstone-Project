<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

$student_id = $_GET['student_id'] ?? null;
$advisory_id = $_GET['advisory_id'] ?? null;
if (!$student_id || !$advisory_id) {
    echo json_encode(["status" => "error", "message" => "Missing student_id or advisory_id."]);
    exit;
}

$stmt = $conn->prepare('
    SELECT sop.*, s.subject_name
    FROM tbl_subject_overall_progress sop
    JOIN tbl_subjects s ON sop.subject_id = s.subject_id
    WHERE sop.student_id = ? AND sop.advisory_id = ?
');
$stmt->execute([$student_id, $advisory_id]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => "success", "progress" => $rows]); 