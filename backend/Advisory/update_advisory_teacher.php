<?php
// CORS headers are handled in connection.php which supports production domains
include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST requests are allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Debug logging
error_log("Received data: " . json_encode($data));

if (!isset($data['advisory_id'], $data['type'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}
$advisory_id = intval($data['advisory_id']);
$teacher_id = $data['teacher_id']; // Don't convert to int yet, allow null
$type = $data['type'];
if (!in_array($type, ['lead', 'assistant'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid type']);
    exit;
}

// For lead teachers, teacher_id is required and cannot be null
if ($type === 'lead' && (empty($teacher_id) || $teacher_id === null)) {
    http_response_code(400);
    echo json_encode(['message' => 'Lead teacher ID is required']);
    exit;
}

// For assistant teachers, teacher_id can be null (to remove assignment)
if ($type === 'assistant' && $teacher_id === null) {
    error_log("Removing assistant teacher for advisory_id: " . $advisory_id);
    // Remove assistant teacher assignment
    $stmt = $conn->prepare("UPDATE tbl_advisory SET assistant_teacher_id = NULL WHERE advisory_id = ?");
    if ($stmt->execute([$advisory_id])) {
        error_log("Successfully removed assistant teacher");
        echo json_encode(['status' => 'success', 'message' => 'Assistant teacher removed']);
    } else {
        error_log("Failed to remove assistant teacher: " . json_encode($stmt->errorInfo()));
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to remove assistant teacher']);
    }
    exit;
}

// For non-null teacher assignments, validate the teacher_id
if (empty($teacher_id) || $teacher_id === null) {
    http_response_code(400);
    echo json_encode(['message' => 'Teacher ID is required']);
    exit;
}

$teacher_id = intval($teacher_id);

// Check if teacher is already assigned as lead or assistant (only for non-null assignments)
$stmt = $conn->prepare('SELECT COUNT(*) FROM tbl_advisory WHERE (lead_teacher_id = ? OR assistant_teacher_id = ?) AND advisory_id != ?');
$stmt->execute([$teacher_id, $teacher_id, $advisory_id]);
if ($stmt->fetchColumn() > 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Teacher is already assigned to another advisory']);
    exit;
}
// Update advisory
$field = $type === 'lead' ? 'lead_teacher_id' : 'assistant_teacher_id';
$stmt = $conn->prepare("UPDATE tbl_advisory SET $field = ? WHERE advisory_id = ?");
if ($stmt->execute([$teacher_id, $advisory_id])) {
    echo json_encode(['status' => 'success', 'message' => 'Advisory updated']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update advisory']);
} 