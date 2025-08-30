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
    // Test 1: Check total student counts (active vs all)
    $stmt = $conn->prepare("SELECT COUNT(*) as total_students FROM tbl_students");
    $stmt->execute();
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['total_students'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as active_students FROM tbl_students WHERE stud_school_status = 'Active'");
    $stmt->execute();
    $activeStudents = $stmt->fetch(PDO::FETCH_ASSOC)['active_students'];
    
    $stmt = $conn->prepare("SELECT COUNT(*) as inactive_students FROM tbl_students WHERE stud_school_status != 'Active'");
    $stmt->execute();
    $inactiveStudents = $stmt->fetch(PDO::FETCH_ASSOC)['inactive_students'];
    
    // Test 2: Check advisory counts (should only show active students)
    $stmt = $conn->prepare("
        SELECT 
            a.advisory_id,
            a.total_students as recorded_total,
            COUNT(CASE WHEN s.stud_school_status = 'Active' THEN 1 END) as actual_active_count,
            COUNT(*) as actual_total_count
        FROM tbl_advisory a
        LEFT JOIN tbl_student_assigned sa ON a.advisory_id = sa.advisory_id
        LEFT JOIN tbl_students s ON sa.student_id = s.student_id
        GROUP BY a.advisory_id
        ORDER BY a.advisory_id
    ");
    $stmt->execute();
    $advisoryData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 3: Check get_students_by_level for different levels
    $levelTests = [];
    $stmt = $conn->prepare("SELECT level_id, level_name FROM tbl_student_levels ORDER BY level_id");
    $stmt->execute();
    $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($levels as $level) {
        $level_id = $level['level_id'];
        
        // Total students in level
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students WHERE level_id = ?");
        $stmt->execute([$level_id]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Active students in level
        $stmt = $conn->prepare("SELECT COUNT(*) as active FROM tbl_students WHERE level_id = ? AND stud_school_status = 'Active'");
        $stmt->execute([$level_id]);
        $active = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
        
        $levelTests[] = [
            'level_id' => $level_id,
            'level_name' => $level['level_name'],
            'total_students' => $total,
            'active_students' => $active,
            'inactive_students' => $total - $active
        ];
    }
    
    // Test 4: Check if any queries are still returning inactive students
    $potentialIssues = [];
    
    // Check get_all_advisory_details
    $stmt = $conn->prepare("
        SELECT 
            sa.advisory_id,
            COUNT(*) as total_assigned,
            COUNT(CASE WHEN s.stud_school_status = 'Active' THEN 1 END) as active_assigned,
            COUNT(CASE WHEN s.stud_school_status != 'Active' THEN 1 END) as inactive_assigned
        FROM tbl_student_assigned sa
        JOIN tbl_students s ON sa.student_id = s.student_id
        GROUP BY sa.advisory_id
        HAVING inactive_assigned > 0
    ");
    $stmt->execute();
    $advisoriesWithInactive = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 5: Sample a few specific endpoints
    $endpointTests = [];
    
    // Test get_attendance_report_data behavior
    $stmt = $conn->prepare("
        SELECT 
            sl.level_name,
            s.stud_school_status,
            COUNT(*) as count
        FROM tbl_students s
        JOIN tbl_student_levels sl ON s.level_id = sl.level_id
        WHERE s.parent_id IS NOT NULL
        GROUP BY sl.level_name, s.stud_school_status
        ORDER BY sl.level_name, s.stud_school_status
    ");
    $stmt->execute();
    $attendanceTestData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'test_results' => [
            'student_counts' => [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'inactive_students' => $inactiveStudents,
                'percentage_active' => round(($activeStudents / $totalStudents) * 100, 2)
            ],
            'advisory_data' => $advisoryData,
            'level_breakdown' => $levelTests,
            'advisories_with_inactive_students' => $advisoriesWithInactive,
            'attendance_report_data_test' => $attendanceTestData
        ],
        'summary' => [
            'total_advisories_tested' => count($advisoryData),
            'levels_tested' => count($levelTests),
            'advisories_with_inactive_assignments' => count($advisoriesWithInactive),
            'soft_exclusion_status' => count($advisoriesWithInactive) > 0 ? 'Some inactive students still in assignments' : 'Working correctly'
        ],
        'recommendations' => [
            'advisory_count_accuracy' => 'Check if advisory total_students match actual_active_count',
            'inactive_assignments' => count($advisoriesWithInactive) > 0 ? 'Consider reviewing inactive student assignments' : 'All assignments contain only active students',
            'testing_note' => 'This test verifies that the soft exclusion is working properly across the system'
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error during testing', 
        'error' => $e->getMessage()
    ]);
}
?>
