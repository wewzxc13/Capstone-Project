<?php
require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/tracking_helper.php';
require_once __DIR__ . '/shape_mapping_helper.php';
header('Content-Type: application/json');

// Accept JSON input
$data = json_decode(file_get_contents('php://input'), true);
$student_id = $data['student_id'] ?? null;
$quarter_id = $data['quarter_id'] ?? null;
$subject_id = $data['subject_id'] ?? null;

// Debug: Log received parameters
file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Received: student_id=$student_id, quarter_id=$quarter_id, subject_id=$subject_id\n", FILE_APPEND);

if (!$student_id || !$quarter_id || !$subject_id) {
    file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Error: Missing required parameters.\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

// 1. Get all feedbacks for this student/quarter/subject from appropriate tracking table
$level_id = getStudentLevelId($conn, $student_id);
if (!$level_id) {
    file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Error: Student not found or no level assigned.\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Student not found or no level assigned."]);
    exit;
}

$table_name = getTrackingTableName($level_id);
if (!$table_name) {
    file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Error: Invalid level for student.\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Invalid level for student."]);
    exit;
}

$sql = "SELECT t.visual_feedback_id
        FROM $table_name t
        JOIN tbl_activities a ON t.activity_id = a.activity_id
        WHERE t.student_id = ? AND a.subject_id = ? AND a.quarter_id = ? AND a.activity_status = 'Active'";
$stmt = $conn->prepare($sql);
$stmt->execute([$student_id, $subject_id, $quarter_id]);
$feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Feedbacks found: " . json_encode($feedbacks) . "\n", FILE_APPEND);

if (count($feedbacks) === 0) {
    file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Error: No feedbacks found for this student/quarter/subject.\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "No feedbacks found for this student/quarter/subject."]);
    exit;
}

// 2. Get dynamic shape-to-score mapping from database
$shapeScore = getDynamicShapeMappingById($conn);
logShapeMapping("update_quarter_feedback", $shapeScore, $conn);

// 3. Calculate average
$total = 0;
$count = 0;
foreach ($feedbacks as $fb) {
    $score = $shapeScore[$fb['visual_feedback_id']] ?? null;
    if ($score === null) continue;
    $total += $score;
    $count++;
}
file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Total=$total, Count=$count\n", FILE_APPEND);
if ($count === 0) {
    file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Error: No valid feedback shapes found.\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "No valid feedback shapes found."]);
    exit;
}
$average = round($total / $count, 3); // decimal(4,3) format
file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Average=$average\n", FILE_APPEND);

// 4. Find the shape for the average using DB min/max
$sql2 = "SELECT visual_feedback_id FROM tbl_visual_feedback WHERE ? >= min_score AND ? <= max_score LIMIT 1";
$stmt2 = $conn->prepare($sql2);
$stmt2->execute([$average, $average]);
$row = $stmt2->fetch(PDO::FETCH_ASSOC);
file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Shape lookup result: " . json_encode($row) . "\n", FILE_APPEND);

$final_visual_feedback_id = $row['visual_feedback_id'] ?? null;

// 5. Update tbl_quarter_feedback
$sql3 = "INSERT INTO tbl_quarter_feedback (student_id, quarter_id, subject_id, visual_feedback_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE visual_feedback_id = VALUES(visual_feedback_id)";
$stmt3 = $conn->prepare($sql3);
$stmt3->execute([$student_id, $quarter_id, $subject_id, $final_visual_feedback_id]);
file_put_contents(__DIR__ . '/debug_update_quarter_feedback.txt', "Updated tbl_quarter_feedback with visual_feedback_id=$final_visual_feedback_id\n", FILE_APPEND);

echo json_encode([
    "status" => "success",
    "message" => "Quarter feedback updated for the student.",
    "average" => $average,
    "visual_feedback_id" => $final_visual_feedback_id
]); 