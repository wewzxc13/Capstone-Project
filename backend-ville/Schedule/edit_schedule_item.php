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
    echo json_encode(['status' => 'error', 'message' => 'Only POST requests are allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$item_type = $data['item_type'] ?? null; // 'subject' or 'routine'
$item_id = $data['item_id'] ?? null;
$new_name = $data['new_name'] ?? null;

// Debug logging
error_log("Edit Schedule Item - Received data: " . json_encode($data));
error_log("Edit Schedule Item - item_type: " . var_export($item_type, true));
error_log("Edit Schedule Item - item_id: " . var_export($item_id, true));
error_log("Edit Schedule Item - new_name: " . var_export($new_name, true));

if (!$item_type || !$item_id || !$new_name) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing item_type, item_id, or new_name']);
    exit;
}

// Validate item_type
if ($item_type !== 'subject' && $item_type !== 'routine') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid item_type. Must be "subject" or "routine"']);
    exit;
}

// Validate item_id
if (!is_numeric($item_id) || $item_id <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid item_id']);
    exit;
}

// Validate name
if (empty(trim($new_name))) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Name cannot be empty']);
    exit;
}

try {
    // Set table and column names based on item type
    $table_name = $item_type === 'subject' ? 'tbl_subjects' : 'tbl_routines';
    $id_column = $item_type === 'subject' ? 'subject_id' : 'routine_id';
    $name_column = $item_type === 'subject' ? 'subject_name' : 'routine_name';
    
    // Check if the item exists
    $stmt = $conn->prepare("SELECT * FROM $table_name WHERE $id_column = ?");
    $stmt->execute([$item_id]);
    $existing_item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existing_item) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => ucfirst($item_type) . ' not found']);
        exit;
    }
    
    // Check if the new name already exists (excluding the current item)
    $stmt = $conn->prepare("SELECT * FROM $table_name WHERE $name_column = ? AND $id_column != ?");
    $stmt->execute([trim($new_name), $item_id]);
    $duplicate = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($duplicate) {
        http_response_code(409);
        echo json_encode([
            'status' => 'error', 
            'message' => ucfirst($item_type) . ' "' . trim($new_name) . '" already exists'
        ]);
        exit;
    }
    
    // Update the item
    $stmt = $conn->prepare("UPDATE $table_name SET $name_column = ? WHERE $id_column = ?");
    $result = $stmt->execute([trim($new_name), $item_id]);
    
    if ($result) {
        echo json_encode([
            'status' => 'success', 
            'message' => ucfirst($item_type) . ' updated successfully',
            'data' => [
                'id' => $item_id,
                'old_name' => $existing_item[$name_column],
                'new_name' => trim($new_name),
                'type' => $item_type
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to update ' . $item_type]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 