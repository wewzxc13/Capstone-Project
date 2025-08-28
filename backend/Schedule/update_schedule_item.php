<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST requests are allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$schedule_item_id = $data['schedule_item_id'] ?? null;
$schedule_id = $data['schedule_id'] ?? null;
$item_type = $data['item_type'] ?? null;
$subject_id = $data['subject_id'] ?? null;
$subject_id_2 = $data['subject_id_2'] ?? null;
$routine_id = $data['routine_id'] ?? null;
$routine_id_2 = $data['routine_id_2'] ?? null;

// Debug logging
error_log("Update Schedule Item - Received data: " . json_encode($data));
error_log("Update Schedule Item - item_type: " . var_export($item_type, true));

if (!$schedule_item_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing schedule_item_id']);
    exit;
}

// Validate item_type
if ($item_type === null || ($item_type !== 1 && $item_type !== 2)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid item_type. Must be 1 (subject) or 2 (routine)']);
    exit;
}

// Validate that subject_id is provided when item_type is 1 (subject)
if ($item_type == 1 && $subject_id === null) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Subject ID is required when item_type is subject (1)']);
    exit;
}

// Validate that routine_id is provided when item_type is 2 (routine)
if ($item_type == 2 && $routine_id === null) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Routine ID is required when item_type is routine (2)']);
    exit;
}

try {
    // Check if the schedule item exists
    $stmt = $conn->prepare('SELECT * FROM tbl_schedule_items WHERE schedule_item_id = ?');
    $stmt->execute([$schedule_item_id]);
    $currentItem = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentItem) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Schedule item not found']);
        exit;
    }

    // Update the existing schedule item
    $stmt = $conn->prepare('UPDATE tbl_schedule_items SET item_type = ?, subject_id = ?, subject_id_2 = ?, routine_id = ?, routine_id_2 = ? WHERE schedule_item_id = ?');
    $result = $stmt->execute([
        $item_type,
        $subject_id,
        $subject_id_2,
        $routine_id,
        $routine_id_2,
        $schedule_item_id
    ]);

    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'Schedule item updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to update schedule item']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 