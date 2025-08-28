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

// Debug logging
error_log("Delete Schedule Item - Received data: " . json_encode($data));
error_log("Delete Schedule Item - item_type: " . var_export($item_type, true));
error_log("Delete Schedule Item - item_id: " . var_export($item_id, true));

if (!$item_type || !$item_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing item_type or item_id']);
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
    
    // Check if the item is currently being used in tbl_schedule_items
    $schedule_check_query = "";
    if ($item_type === 'subject') {
        $schedule_check_query = "SELECT COUNT(*) as count FROM tbl_schedule_items WHERE subject_id = ? OR subject_id_2 = ?";
    } else {
        $schedule_check_query = "SELECT COUNT(*) as count FROM tbl_schedule_items WHERE routine_id = ? OR routine_id_2 = ?";
    }
    
    $stmt = $conn->prepare($schedule_check_query);
    $stmt->execute([$item_id, $item_id]);
    $usage_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($usage_count > 0) {
        http_response_code(409);
        echo json_encode([
            'status' => 'error', 
            'message' => ucfirst($item_type) . ' "' . $existing_item[$name_column] . '" cannot be deleted because it is currently being used in the schedule'
        ]);
        exit;
    }
    
    // Delete the item
    $stmt = $conn->prepare("DELETE FROM $table_name WHERE $id_column = ?");
    $result = $stmt->execute([$item_id]);
    
    if ($result) {
        echo json_encode([
            'status' => 'success', 
            'message' => ucfirst($item_type) . ' "' . $existing_item[$name_column] . '" deleted successfully',
            'data' => [
                'id' => $item_id,
                'name' => $existing_item[$name_column],
                'type' => $item_type
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete ' . $item_type]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 