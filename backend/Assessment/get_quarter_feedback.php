<?php
require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/tracking_helper.php';
header('Content-Type: application/json');

$advisory_id = isset($_GET['advisory_id']) ? intval($_GET['advisory_id']) : 0;
$subject_id = isset($_GET['subject_id']) ? intval($_GET['subject_id']) : 0;
if (!$advisory_id || !$subject_id) {
    echo json_encode(["status" => "error", "message" => "Missing advisory_id or subject_id.", "feedback" => []]);
    exit;
}

// 1. Find current quarter based on today's date
$today = date('Y-m-d');
$q_sql = "SELECT quarter_id FROM tbl_quarters WHERE start_date <= ? AND end_date >= ? LIMIT 1";
$q_stmt = $conn->prepare($q_sql);
$q_stmt->bind_param('ss', $today, $today);
$q_stmt->execute();
$q_stmt->bind_result($quarter_id);
$quarter_id = null;
if ($q_stmt->fetch()) {
    // found
}
$q_stmt->close();
if (!$quarter_id) {
    echo json_encode(["status" => "success", "feedback" => []]);
    exit;
}

// 2. Get all students in this advisory from all tracking tables
$students = [];
$tables = ['tbl_tracking_discoverer', 'tbl_tracking_explorer', 'tbl_tracking_adventurer'];

foreach ($tables as $table) {
    $s_sql = "SELECT DISTINCT student_id FROM $table WHERE activity_id IN (SELECT activity_id FROM tbl_activities WHERE advisory_id = ? AND subject_id = ?)";
    $s_stmt = $conn->prepare($s_sql);
    $s_stmt->bind_param('ii', $advisory_id, $subject_id);
    $s_stmt->execute();
    $s_res = $s_stmt->get_result();
    while ($row = $s_res->fetch_assoc()) {
        if (!in_array($row['student_id'], $students)) {
            $students[] = $row['student_id'];
        }
    }
    $s_stmt->close();
}
if (empty($students)) {
    echo json_encode(["status" => "success", "feedback" => []]);
    exit;
}

// 3. Get quarter feedback for these students for this quarter
$in = implode(',', array_fill(0, count($students), '?'));
$types = str_repeat('i', count($students));
$params = $students;
$sql = "SELECT qf.student_id, qf.quarter_id, qf.visual_feedback_id, vf.visual_feedback_shape AS shape, vf.visual_feedback_description AS description FROM tbl_quarter_feedback qf JOIN tbl_visual_feedback vf ON qf.visual_feedback_id = vf.visual_feedback_id WHERE qf.quarter_id = ? AND qf.student_id IN ($in)";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i' . $types, $quarter_id, ...$params);
$stmt->execute();
$res = $stmt->get_result();
$feedback = [];
while ($row = $res->fetch_assoc()) {
    $feedback[] = $row;
}
$stmt->close();

// 4. Output
echo json_encode(["status" => "success", "feedback" => $feedback]); 