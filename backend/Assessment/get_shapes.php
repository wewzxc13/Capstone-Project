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
    
    // Fetch all shapes from tbl_shapes
    $stmt = $conn->prepare("SELECT shape_id, shape_form, shape_name FROM tbl_shapes ORDER BY shape_id");
    $stmt->execute();
    $shapes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "shapes" => $shapes,
        "message" => "Shapes fetched successfully"
    ]);
    
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
