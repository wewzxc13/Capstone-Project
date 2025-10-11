<?php
// Ensure clean JSON output (no HTML errors)
ini_set('display_errors', 0);
ini_set('html_errors', 0);
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight quickly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    if (ob_get_length()) { ob_end_clean(); }
    exit;
}

require_once '../connection.php';

try {
    $response = [
        'success' => true,
        'data' => [],
        'message' => 'Activity tables data retrieved successfully'
    ];

    // Get all tables related to activities
    $activityTables = [
        'tbl_activities' => 'Activities',
        'tbl_subjects' => 'Subjects',
        'tbl_quarters' => 'Quarters',
        'tbl_advisory' => 'Advisory Classes',
        'tbl_activity_progress' => 'Activity Progress',
        'tbl_progress_cards' => 'Progress Cards',
        'tbl_overall_progress' => 'Overall Progress'
    ];

    foreach ($activityTables as $tableName => $displayName) {
        // Check if table exists (PDO)
        $checkStmt = $conn->prepare("SHOW TABLES LIKE :t");
        $checkStmt->execute([':t' => $tableName]);
        
        if ($checkStmt->rowCount() > 0) {
            // Get table structure
            $structureQuery = "DESCRIBE $tableName";
            $structureResult = $conn->query($structureQuery);
            $columns = [];
            
            $structureRows = $structureResult->fetchAll(PDO::FETCH_ASSOC);
            foreach ($structureRows as $row) {
                $columns[] = [
                    'field' => $row['Field'],
                    'type' => $row['Type'],
                    'null' => $row['Null'],
                    'key' => $row['Key'],
                    'default' => $row['Default'],
                    'extra' => $row['Extra']
                ];
            }

            // Get sample data (limit to 50 rows to avoid overwhelming response)
            $dataQuery = "SELECT * FROM $tableName LIMIT 50";
            $dataResult = $conn->query($dataQuery);
            $sampleData = $dataResult->fetchAll(PDO::FETCH_ASSOC);

            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM $tableName";
            $countResult = $conn->query($countQuery);
            $totalCount = $countResult->fetch(PDO::FETCH_ASSOC)['total'];

            $response['data'][$tableName] = [
                'display_name' => $displayName,
                'table_name' => $tableName,
                'total_records' => $totalCount,
                'columns' => $columns,
                'sample_data' => $sampleData,
                'last_updated' => date('Y-m-d H:i:s')
            ];
        } else {
            $response['data'][$tableName] = [
                'display_name' => $displayName,
                'table_name' => $tableName,
                'total_records' => 0,
                'columns' => [],
                'sample_data' => [],
                'last_updated' => date('Y-m-d H:i:s'),
                'note' => 'Table does not exist'
            ];
        }
    }

    // Get additional activity-related information
    $response['summary'] = [
        'total_tables' => count($activityTables),
        'existing_tables' => count(array_filter($response['data'], function($table) {
            return $table['total_records'] > 0 || !isset($table['note']);
        })),
        'total_records_across_tables' => array_sum(array_column($response['data'], 'total_records')),
        'generated_at' => date('Y-m-d H:i:s')
    ];

    if (ob_get_length()) { ob_clean(); }
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    if (ob_get_length()) { ob_clean(); }
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving activity tables data: ' . $e->getMessage(),
        'data' => []
    ]);
}

$conn->close();
if (ob_get_length()) { ob_end_flush(); }
?>
