<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['advisory_id', 'subject_id', 'activity_date'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    $advisory_id = $input['advisory_id'];
    $subject_id = $input['subject_id'];
    $activity_date = $input['activity_date'];
    $exclude_activity_id = $input['exclude_activity_id'] ?? null;
    
    // Include shared database connection
    include_once '../connection.php';
    
    // Check if connection failed
    if (isset($connection_error)) {
        throw new Exception('Database connection failed: ' . $connection_error);
    }
    
    // Check for duplicate date in the same advisory and subject
    // This implements the business rule:
    // - Same advisory + same subject + same date = duplicate (rejected)
    // - Same advisory + different subject + same date = allowed (accepted)
    // - Different advisory + same subject + same date = allowed (accepted)
    
    $sql = "SELECT COUNT(*) FROM tbl_activities 
            WHERE advisory_id = ? AND subject_id = ? AND activity_date = ?";
    $params = [$advisory_id, $subject_id, $activity_date];
    
    // If editing an existing activity, exclude it from the duplicate check
    if ($exclude_activity_id) {
        $sql .= " AND activity_id != ?";
        $params[] = $exclude_activity_id;
    }
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $duplicate_count = $stmt->fetchColumn();
    
    $has_duplicate = $duplicate_count > 0;
    
    // Return result
    echo json_encode([
        'status' => 'success',
        'has_duplicate' => $has_duplicate,
        'message' => $has_duplicate ? 'Duplicate date found for this advisory and subject' : 'Date is available'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?> 