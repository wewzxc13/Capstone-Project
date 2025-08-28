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
$name = $data['name'] ?? null;

// Debug logging
error_log("Add Schedule Item - Received data: " . json_encode($data));
error_log("Add Schedule Item - item_type: " . var_export($item_type, true));
error_log("Add Schedule Item - name: " . var_export($name, true));

if (!$item_type || !$name) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing item_type or name']);
    exit;
}

// Validate item_type
if ($item_type !== 'subject' && $item_type !== 'routine') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid item_type. Must be "subject" or "routine"']);
    exit;
}

// Validate name
if (empty(trim($name))) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Name cannot be empty']);
    exit;
}

try {
    // Check if the name already exists
    $table_name = $item_type === 'subject' ? 'tbl_subjects' : 'tbl_routines';
    $name_column = $item_type === 'subject' ? 'subject_name' : 'routine_name';
    
    $stmt = $conn->prepare("SELECT * FROM $table_name WHERE $name_column = ?");
    $stmt->execute([trim($name)]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        http_response_code(409);
        echo json_encode([
            'status' => 'error', 
            'message' => ucfirst($item_type) . ' "' . trim($name) . '" already exists'
        ]);
        exit;
    }
    
    // Insert the new item
    $stmt = $conn->prepare("INSERT INTO $table_name ($name_column) VALUES (?)");
    $result = $stmt->execute([trim($name)]);
    
    if ($result) {
        $new_id = $conn->lastInsertId();
        echo json_encode([
            'status' => 'success', 
            'message' => ucfirst($item_type) . ' "' . trim($name) . '" added successfully',
            'data' => [
                'id' => $new_id,
                'name' => trim($name),
                'type' => $item_type
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to add ' . $item_type]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 