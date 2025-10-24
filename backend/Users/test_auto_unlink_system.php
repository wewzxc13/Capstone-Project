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
    // Test 1: Check current state of archived parents with linked students
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_lastname,
            u.user_email,
            u.user_status,
            COUNT(s.student_id) as linked_students_count
        FROM tbl_users u
        LEFT JOIN tbl_students s ON u.user_id = s.parent_id
        WHERE u.user_role = 'Parent'
        GROUP BY u.user_id, u.user_firstname, u.user_lastname, u.user_email, u.user_status
        ORDER BY u.user_status DESC, u.user_lastname, u.user_firstname
    ");
    $stmt->execute();
    $allParents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 2: Check specifically for archived parents with linked students
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_lastname,
            u.user_email,
            COUNT(s.student_id) as linked_students_count,
            GROUP_CONCAT(
                CONCAT(s.stud_firstname, ' ', s.stud_lastname) 
                SEPARATOR ', '
            ) as student_names
        FROM tbl_users u
        INNER JOIN tbl_students s ON u.user_id = s.parent_id
        WHERE u.user_status = 'Inactive' 
        AND u.user_role = 'Parent'
        GROUP BY u.user_id, u.user_firstname, u.user_lastname, u.user_email
        ORDER BY u.user_lastname, u.user_firstname
    ");
    $stmt->execute();
    $archivedParentsWithStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 3: Check for orphaned students (no parent linked)
    $stmt = $conn->prepare("
        SELECT 
            student_id,
            stud_firstname,
            stud_lastname,
            stud_school_status,
            level_id,
            parent_id
        FROM tbl_students 
        WHERE parent_id IS NULL
        ORDER BY stud_lastname, stud_firstname
        LIMIT 20
    ");
    $stmt->execute();
    $orphanedStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 4: Check system logs for auto-unlink actions
    $stmt = $conn->prepare("
        SELECT 
            action_type,
            action_description,
            affected_table,
            affected_record_id,
            additional_data,
            timestamp
        FROM tbl_system_logs 
        WHERE action_type IN ('AUTO_UNLINK_STUDENTS', 'PARENT_ARCHIVED', 'CLEANUP_ARCHIVED_PARENT')
        ORDER BY timestamp DESC
        LIMIT 10
    ");
    $stmt->execute();
    $systemLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 5: Summary statistics
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_users WHERE user_role = 'Parent'");
    $stmt->execute();
    $totalParents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_users WHERE user_role = 'Parent' AND user_status = 'Active'");
    $stmt->execute();
    $activeParents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_users WHERE user_role = 'Parent' AND user_status = 'Inactive'");
    $stmt->execute();
    $archivedParents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students WHERE parent_id IS NOT NULL");
    $stmt->execute();
    $studentsWithParents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students WHERE parent_id IS NULL");
    $stmt->execute();
    $studentsWithoutParents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'status' => 'success',
        'test_results' => [
            'summary' => [
                'total_parents' => (int)$totalParents,
                'active_parents' => (int)$activeParents,
                'archived_parents' => (int)$archivedParents,
                'students_with_parents' => (int)$studentsWithParents,
                'students_without_parents' => (int)$studentsWithoutParents
            ],
            'all_parents_status' => $allParents,
            'archived_parents_with_students' => $archivedParentsWithStudents,
            'orphaned_students_sample' => $orphanedStudents,
            'system_logs_sample' => $systemLogs
        ],
        'analysis' => [
            'archived_parents_with_linked_students' => count($archivedParentsWithStudents),
            'total_orphaned_students' => count($orphanedStudents),
            'system_health' => count($archivedParentsWithStudents) === 0 ? 'GOOD' : 'NEEDS_CLEANUP',
            'recommendations' => [
                'If archived_parents_with_linked_students > 0, run cleanup_existing_archived_parents.php',
                'If system_health is GOOD, the auto-unlink system is working correctly',
                'Monitor system_logs for auto-unlink actions'
            ]
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Test failed: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
