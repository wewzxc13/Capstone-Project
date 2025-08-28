<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$advisory_id = isset($_GET['advisory_id']) ? $_GET['advisory_id'] : null;

if (!$student_id || !$advisory_id) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters: student_id, advisory_id"]);
    exit;
}

$stmt = $conn->prepare('SELECT * FROM tbl_overall_progress WHERE student_id = ? AND advisory_id = ? ORDER BY overall_progress_id DESC LIMIT 1');
$stmt->execute([$student_id, $advisory_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo json_encode(["status" => "error", "message" => "No overall progress found."]);
    exit;
}
// Get shape for visual_feedback_id
$vfStmt = $conn->prepare('SELECT visual_feedback_shape FROM tbl_visual_feedback WHERE visual_feedback_id = ?');
$vfStmt->execute([$row['overall_visual_feedback_id']]);
$vf = $vfStmt->fetch(PDO::FETCH_ASSOC);
$visual_shape = $vf ? $vf['visual_feedback_shape'] : null;

$response = [
    "status" => "success",
    "progress" => [
        "overall_progress_id" => $row['overall_progress_id'],
        "student_id" => $row['student_id'],
        "advisory_id" => $row['advisory_id'],
        "overall_avg_score" => $row['overall_avg_score'],
        "visual_feedback_id" => $row['overall_visual_feedback_id'],
        "visual_shape" => $visual_shape,
        "risk_id" => $row['risk_id']
    ]
];
echo json_encode($response); 