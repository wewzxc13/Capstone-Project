<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

try {
    // Read the SQL file
    $sqlFile = __DIR__ . '/create_progress_notification_table.sql';
    $sql = file_get_contents($sqlFile);
    
    // Split by semicolon to execute each statement separately
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $results = [];
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $conn->exec($statement);
                $results[] = [
                    'statement' => substr($statement, 0, 50) . '...',
                    'status' => 'success'
                ];
            } catch (Exception $e) {
                $results[] = [
                    'statement' => substr($statement, 0, 50) . '...',
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Notification tables setup completed',
        'results' => $results
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?> 