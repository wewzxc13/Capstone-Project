<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

$teacher_id = $_GET['teacher_id'] ?? null;
if (!$teacher_id) {
    echo json_encode(["status" => "error", "message" => "Missing teacher_id."]);
    exit;
}

try {
    // First get the advisory_id for this teacher
    $stmt = $conn->prepare('
        SELECT advisory_id, level_id 
        FROM tbl_advisory 
        WHERE lead_teacher_id = ? OR assistant_teacher_id = ?
        LIMIT 1
    ');
    $stmt->execute([$teacher_id, $teacher_id]);
    $advisory = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$advisory) {
        echo json_encode(["status" => "error", "message" => "No advisory found for this teacher."]);
        exit;
    }
    
    $advisory_id = $advisory['advisory_id'];
    
    // Get average scores for all subjects in this advisory, rounded to 2 decimal places
    // Only count students linked to parents AND currently assigned to this advisory
    $stmt = $conn->prepare('
        SELECT 
            s.subject_name,
            ROUND(AVG(sop.finalsubj_avg_score), 2) as average_score
        FROM tbl_subject_overall_progress sop
        JOIN tbl_subjects s ON sop.subject_id = s.subject_id
        JOIN tbl_students st ON sop.student_id = st.student_id
        JOIN tbl_student_assigned sa ON st.student_id = sa.student_id
        WHERE sop.advisory_id = ? 
          AND sop.finalsubj_avg_score IS NOT NULL 
          AND st.parent_id IS NOT NULL 
          AND st.stud_school_status = "Active"
          AND sa.advisory_id = ?
        GROUP BY s.subject_id, s.subject_name
        ORDER BY s.subject_name
    ');
    $stmt->execute([$advisory_id, $advisory_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the data for the chart
    $subjects = [];
    $scores = [];
    $colors = [
        "#f4b940", // yellow
        "#f57a7a", // red
        "#3ec3ff", // blue
        "#b59df0", // purple
        "#34d399", // green
        "#f472b6", // pink
    ];
    
    if (empty($results)) {
        // If no data, get all subjects for this level to show empty chart
        $stmt = $conn->prepare('
            SELECT subject_name 
            FROM tbl_subjects 
            WHERE level_id = ? 
            ORDER BY subject_name
        ');
        $stmt->execute([$advisory['level_id']]);
        $allSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($allSubjects as $index => $row) {
            $subjects[] = $row['subject_name'];
            $scores[] = 0; // No data available
        }
    } else {
        foreach ($results as $index => $row) {
            $subjects[] = $row['subject_name'];
            $scores[] = floatval($row['average_score']);
        }
    }
    
    echo json_encode([
        "status" => "success",
        "data" => [
            "labels" => $subjects,
            "scores" => $scores,
            "colors" => array_slice($colors, 0, count($subjects))
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?> 