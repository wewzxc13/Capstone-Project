<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../connection.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('No input data received');
    }
    
    $user_id = isset($input['user_id']) ? intval($input['user_id']) : null;
    $archive_type = isset($input['archive_type']) ? $input['archive_type'] : null;
    $quarter_id = isset($input['quarter_id']) ? intval($input['quarter_id']) : null;
    $advisory_id = isset($input['advisory_id']) ? intval($input['advisory_id']) : null;
    
    if (!$user_id) {
        throw new Exception('User ID is required');
    }
    
    if (!in_array($archive_type, ['overall', 'quarter', 'class'])) {
        throw new Exception('Invalid archive type');
    }
    
    // Build the WHERE clause based on archive type
    $where_conditions = [];
    $params = [];
    
    switch ($archive_type) {
        case 'overall':
            $where_conditions[] = "activity_status = 'Active'";
            break;
            
        case 'quarter':
            if (!$quarter_id) {
                throw new Exception('Quarter ID is required for quarter-based archiving');
            }
            $where_conditions[] = "quarter_id = ? AND activity_status = 'Active'";
            $params[] = $quarter_id;
            break;
            
        case 'class':
            if (!$advisory_id) {
                throw new Exception('Advisory ID is required for class-based archiving');
            }
            $where_conditions[] = "advisory_id = ? AND activity_status = 'Active'";
            $params[] = $advisory_id;
            break;
    }
    
    $where_clause = implode(' AND ', $where_conditions);
    
    // First, get the count of activities that will be archived
    $count_query = "SELECT COUNT(*) FROM tbl_activities WHERE $where_clause";
    $count_stmt = $conn->prepare($count_query);
    $count_stmt->execute($params);
    $activities_to_archive = $count_stmt->fetchColumn();
    
    if ($activities_to_archive == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'No active activities found to archive'
        ]);
        exit();
    }
    
    // Perform the bulk archive
    $archive_query = "UPDATE tbl_activities SET activity_status = 'Archived' WHERE $where_clause";
    $archive_stmt = $conn->prepare($archive_query);
    $archive_stmt->execute($params);
    
    $archived_count = $archive_stmt->rowCount();
    
    // Log the action to tbl_system_logs with user-friendly descriptions
    $action_description = "Archived $archived_count activities";
    
    if ($archive_type === 'quarter') {
        // Get quarter name for user-friendly logging
        $quarter_query = "SELECT quarter_name FROM tbl_quarters WHERE quarter_id = ?";
        $quarter_stmt = $conn->prepare($quarter_query);
        $quarter_stmt->execute([$quarter_id]);
        $quarter_name = $quarter_stmt->fetchColumn();
        $action_description .= " for quarter: " . ($quarter_name ?: "Unknown Quarter");
    } elseif ($archive_type === 'class') {
        // Get advisory class details for user-friendly logging
        $advisory_query = "SELECT level_name FROM tbl_advisory a JOIN tbl_student_levels sl ON a.level_id = sl.level_id WHERE a.advisory_id = ?";
        $advisory_stmt = $conn->prepare($advisory_query);
        $advisory_stmt->execute([$advisory_id]);
        $level_name = $advisory_stmt->fetchColumn();
        
        if ($level_name) {
            $action_description .= " for class: " . $level_name;
        } else {
            $action_description .= " for class: Unknown Class";
        }
    } else {
        $action_description .= ": Overall";
    }
    
    $log_query = "INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action) VALUES (?, NULL, NULL, ?)";
    $log_stmt = $conn->prepare($log_query);
    $log_stmt->execute([$user_id, $action_description]);
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully archived $archived_count activities",
        'archived_count' => $archived_count,
        'archive_type' => $archive_type,
        'quarter_id' => $quarter_id,
        'advisory_id' => $advisory_id
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn = null;
?>
