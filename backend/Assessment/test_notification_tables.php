<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

try {
    // Test if tables exist
    $tables = ['tbl_notifications', 'tbl_notification_recipients', 'tbl_progress_notification'];
    $results = [];
    
    foreach ($tables as $table) {
        $stmt = $conn->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($exists) {
            // Get table structure
            $stmt2 = $conn->prepare("DESCRIBE $table");
            $stmt2->execute();
            $columns = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            
            $results[$table] = [
                'exists' => true,
                'columns' => $columns
            ];
        } else {
            $results[$table] = [
                'exists' => false,
                'columns' => []
            ];
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'tables' => $results
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?> 