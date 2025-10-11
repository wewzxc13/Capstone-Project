<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

// Accept student_id from GET or POST
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
if ($student_id === null && isset($_POST['student_id'])) {
    $student_id = intval($_POST['student_id']);
}

if (!$student_id) {
    echo json_encode(["status" => "error", "message" => "Missing student_id.", "feedback" => []]);
    exit;
}

try {
    $sql = "SELECT 
                qf.subject_id, 
                sub.subject_name, 
                qf.quarter_id, 
                q.quarter_name, 
                qf.visual_feedback_id, 
                vf.visual_feedback_shape AS shape, 
                vf.visual_feedback_description AS description
            FROM tbl_quarter_feedback qf
            JOIN tbl_visual_feedback vf ON qf.visual_feedback_id = vf.visual_feedback_id
            JOIN tbl_subjects sub ON qf.subject_id = sub.subject_id
            JOIN tbl_quarters q ON qf.quarter_id = q.quarter_id
            WHERE qf.student_id = ?
            ORDER BY qf.subject_id, qf.quarter_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$student_id]);
    $feedback = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "feedback" => $feedback]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error", "error" => $e->getMessage()]);
} 