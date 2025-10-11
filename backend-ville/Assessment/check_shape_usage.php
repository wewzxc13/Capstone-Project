<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../connection.php';

try {
    // Check if connection was successful
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    // Get JSON input to check specific shape
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input && isset($input['shape'])) {
        // Check if specific shape is in use
        $shape = trim($input['shape']);
        $stmt = $conn->prepare("SELECT visual_feedback_id, visual_feedback_name, visual_feedback_description FROM tbl_visual_feedback WHERE visual_feedback_shape = ?");
        $stmt->execute([$shape]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "shape" => $shape,
            "in_use" => count($results) > 0,
            "usage_count" => count($results),
            "records" => $results
        ]);
    } else {
        // Get all shapes currently in use
        $stmt = $conn->prepare("SELECT visual_feedback_id, visual_feedback_shape, visual_feedback_name, visual_feedback_description FROM tbl_visual_feedback ORDER BY visual_feedback_id");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "total_records" => count($results),
            "shapes_in_use" => $results
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>
