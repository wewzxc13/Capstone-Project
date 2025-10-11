<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../connection.php';

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Only POST requests are accepted."
    ]);
    exit();
}

try {
    // Check if connection was successful
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Invalid JSON input");
    }
    
    // Validate required fields
    $required_fields = ['visual_feedback_id', 'visual_feedback_shape', 'visual_feedback_name', 'visual_feedback_description'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    $visual_feedback_id = $input['visual_feedback_id'];
    $visual_feedback_shape = trim($input['visual_feedback_shape']);
    $visual_feedback_name = trim($input['visual_feedback_name']);
    $visual_feedback_description = trim($input['visual_feedback_description']);
    
    // Validate visual_feedback_id is numeric
    if (!is_numeric($visual_feedback_id)) {
        throw new Exception("Invalid visual_feedback_id");
    }
    
    // Check if the record exists
    $check_stmt = $conn->prepare("SELECT visual_feedback_id FROM tbl_visual_feedback WHERE visual_feedback_id = ?");
    $check_stmt->execute([$visual_feedback_id]);
    
    if ($check_stmt->rowCount() === 0) {
        throw new Exception("Visual feedback record not found");
    }
    
    // Check if the shape is already used by another record (excluding current record)
    // Use BINARY comparison to avoid collation issues with emojis
    $duplicate_check = $conn->prepare("SELECT visual_feedback_id FROM tbl_visual_feedback WHERE BINARY visual_feedback_shape = BINARY ? AND visual_feedback_id != ?");
    $duplicate_check->execute([$visual_feedback_shape, $visual_feedback_id]);
    
    if ($duplicate_check->rowCount() > 0) {
        throw new Exception("Shape '$visual_feedback_shape' is already used by another scoring item");
    }
    
    // Validate that the shape exists in tbl_shapes
    $shape_check = $conn->prepare("SELECT shape_id FROM tbl_shapes WHERE BINARY shape_form = BINARY ?");
    $shape_check->execute([$visual_feedback_shape]);
    
    if ($shape_check->rowCount() === 0) {
        throw new Exception("Shape '$visual_feedback_shape' is not a valid shape option");
    }
    
    // Update the record
    $update_stmt = $conn->prepare("
        UPDATE tbl_visual_feedback 
        SET 
            visual_feedback_shape = ?,
            visual_feedback_name = ?,
            visual_feedback_description = ?
        WHERE visual_feedback_id = ?
    ");
    
    $result = $update_stmt->execute([
        $visual_feedback_shape,
        $visual_feedback_name,
        $visual_feedback_description,
        $visual_feedback_id
    ]);
    
    if ($result) {
        // Log the update operation to tbl_system_logs
        $log_stmt = $conn->prepare("
            INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
            VALUES (:user_id, :target_user_id, :target_student_id, :action, NOW())
        ");
        
        // Get user_id from input or set to null if not provided
        $user_id = isset($input['user_id']) ? $input['user_id'] : null;
        
        $log_stmt->execute([
            ':user_id' => $user_id,
            ':target_user_id' => null,
            ':target_student_id' => null,
            ':action' => 'Updated Visual Feedback'
        ]);
        
        // Fetch the updated record to return
        $fetch_stmt = $conn->prepare("
            SELECT 
                visual_feedback_id,
                visual_feedback_shape,
                visual_feedback_name,
                visual_feedback_description,
                min_score,
                max_score
            FROM tbl_visual_feedback 
            WHERE visual_feedback_id = ?
        ");
        $fetch_stmt->execute([$visual_feedback_id]);
        $updated_record = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "message" => "Visual feedback updated successfully",
            "data" => $updated_record
        ]);
    } else {
        throw new Exception("Failed to update visual feedback");
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>
