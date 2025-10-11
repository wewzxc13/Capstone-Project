<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Get all subjects from class schedule
    $subjectStmt = $conn->prepare('
        SELECT DISTINCT s.subject_id, s.subject_name
        FROM tbl_subjects s
        JOIN tbl_subject_overall_progress sop ON s.subject_id = sop.subject_id
        ORDER BY s.subject_name
    ');
    $subjectStmt->execute();
    $subjects = $subjectStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($subjects)) {
        echo json_encode([
            "status" => "success",
            "message" => "No subjects found",
            "hasData" => false,
            "subjectNames" => [],
            "subjectData" => []
        ]);
        exit();
    }
    
    $subjectNames = array_column($subjects, 'subject_name');
    $subjectData = [];
    
    // Get all advisory classes with their level information
    $advisoryStmt = $conn->prepare('
        SELECT 
            a.advisory_id,
            a.level_id,
            sl.level_name
        FROM tbl_advisory a
        LEFT JOIN tbl_student_levels sl ON a.level_id = sl.level_id
        ORDER BY a.level_id
    ');
    $advisoryStmt->execute();
    $advisories = $advisoryStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($advisories as $advisory) {
        $advisory_id = $advisory['advisory_id'];
        $level_id = $advisory['level_id'];
        $level_name = $advisory['level_name'];
        
        // First check if this advisory has any active students currently assigned
        $checkActiveStudents = $conn->prepare('
            SELECT COUNT(*) as active_count
            FROM tbl_student_assigned sa
            JOIN tbl_students s ON sa.student_id = s.student_id
            WHERE sa.advisory_id = ? AND s.stud_school_status = "Active" AND s.parent_id IS NOT NULL
        ');
        $checkActiveStudents->execute([$advisory_id]);
        $activeCheck = $checkActiveStudents->fetch(PDO::FETCH_ASSOC);
        
        // Skip this advisory if it has no active students
        if ($activeCheck['active_count'] == 0) {
            continue;
        }
        
        // Map level_id to class name
        $className = '';
        switch ($level_id) {
            case 1:
                $className = 'Discoverer';
                break;
            case 2:
                $className = 'Explorer';
                break;
            case 3:
                $className = 'Adventurer';
                break;
            default:
                $className = $level_name || 'Unknown';
        }
        
        // Initialize subject data for this class
        $subjectData[$className] = [];
        foreach ($subjectNames as $subjectName) {
            $subjectData[$className][$subjectName] = 0;
        }
        
        // Get average subject scores for this advisory
        foreach ($subjects as $subject) {
            $subject_id = $subject['subject_id'];
            $subject_name = $subject['subject_name'];
            
            $avgStmt = $conn->prepare('
                SELECT AVG(sop.finalsubj_avg_score) as avg_score, COUNT(*) as student_count
                FROM tbl_subject_overall_progress sop
                JOIN tbl_students s ON sop.student_id = s.student_id
                JOIN tbl_student_assigned sa ON s.student_id = sa.student_id
                WHERE sop.subject_id = ? 
                  AND sop.advisory_id = ? 
                  AND sop.finalsubj_avg_score IS NOT NULL 
                  AND s.parent_id IS NOT NULL 
                  AND s.stud_school_status = "Active"
                  AND sa.advisory_id = ?
            ');
            $avgStmt->execute([$subject_id, $advisory_id, $advisory_id]);
            $result = $avgStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && $result['student_count'] > 0) {
                $subjectData[$className][$subject_name] = round($result['avg_score'], 2);
            }
        }
    }
    
    echo json_encode([
        "status" => "success",
        "hasData" => !empty($subjectData),
        "subjectNames" => $subjectNames,
        "subjectData" => $subjectData
    ]);
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?> 