<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

try {
    // Test 1: Check total inactive students vs inactive students with parent linking
    $stmt = $conn->prepare("SELECT COUNT(*) as total_inactive FROM tbl_students WHERE stud_school_status = 'Inactive'");
    $stmt->execute();
    $totalInactive = $stmt->fetch(PDO::FETCH_ASSOC)['total_inactive'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as inactive_with_parent FROM tbl_students WHERE stud_school_status = 'Inactive' AND parent_id IS NOT NULL");
    $stmt->execute();
    $inactiveWithParent = $stmt->fetch(PDO::FETCH_ASSOC)['inactive_with_parent'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as inactive_without_parent FROM tbl_students WHERE stud_school_status = 'Inactive' AND parent_id IS NULL");
    $stmt->execute();
    $inactiveWithoutParent = $stmt->fetch(PDO::FETCH_ASSOC)['inactive_without_parent'];
    
    // Test 2: Check by level
    $stmt = $conn->prepare("
        SELECT s.level_id, 
               COUNT(*) as total_inactive,
               COUNT(CASE WHEN s.parent_id IS NOT NULL THEN 1 END) as inactive_with_parent,
               COUNT(CASE WHEN s.parent_id IS NULL THEN 1 END) as inactive_without_parent
        FROM tbl_students s
        WHERE s.stud_school_status = 'Inactive'
        GROUP BY s.level_id
        ORDER BY s.level_id
    ");
    $stmt->execute();
    $levelBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 3: Sample inactive students with and without parents
    $stmt = $conn->prepare("
        SELECT student_id, stud_firstname, stud_lastname, parent_id, level_id
        FROM tbl_students 
        WHERE stud_school_status = 'Inactive'
        ORDER BY level_id, stud_lastname
        LIMIT 10
    ");
    $stmt->execute();
    $sampleStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'summary' => [
            'total_inactive_students' => (int)$totalInactive,
            'inactive_with_parent_linking' => (int)$inactiveWithParent,
            'inactive_without_parent_linking' => (int)$inactiveWithoutParent,
            'percentage_with_parent' => $totalInactive > 0 ? round(($inactiveWithParent / $totalInactive) * 100, 2) : 0
        ],
        'level_breakdown' => $levelBreakdown,
        'sample_students' => $sampleStudents,
        'explanation' => [
            'total_inactive' => 'All students with status = Inactive',
            'inactive_with_parent' => 'Inactive students that WILL be counted (have parent_id)',
            'inactive_without_parent' => 'Inactive students that will NOT be counted (no parent_id)',
            'new_logic' => 'Only inactive students WITH parent linking are counted in dashboard'
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Test failed: ' . $e->getMessage()
    ]);
}
?>
