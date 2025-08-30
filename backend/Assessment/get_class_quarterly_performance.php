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
    
    // Get quarterly performance data for all students in this advisory
    // Only count students linked to parents AND currently assigned to this advisory
    $stmt = $conn->prepare('
        SELECT 
            pc.quarter_id,
            pc.quarter_visual_feedback_id,
            COUNT(*) as student_count
        FROM tbl_progress_cards pc
        JOIN tbl_students s ON pc.student_id = s.student_id
        JOIN tbl_student_assigned sa ON s.student_id = sa.student_id
        WHERE pc.advisory_id = ? 
          AND s.parent_id IS NOT NULL 
          AND s.stud_school_status = "Active"
          AND sa.advisory_id = ?
        GROUP BY pc.quarter_id, pc.quarter_visual_feedback_id
        ORDER BY pc.quarter_id, pc.quarter_visual_feedback_id
    ');
    $stmt->execute([$advisory_id, $advisory_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Initialize quarters data
    $quarters = [1, 2, 3, 4];
    $quarterData = [];
    
    foreach ($quarters as $quarter) {
        $quarterData[$quarter] = [
            'quarter_id' => $quarter,
            'total_students' => 0,
            'feedback_counts' => [],
            'average_score' => 0
        ];
    }
    
    // Process the results
    foreach ($results as $row) {
        $quarter = $row['quarter_id'];
        $feedback_id = $row['quarter_visual_feedback_id'];
        $count = $row['student_count'];
        
        if (isset($quarterData[$quarter])) {
            $quarterData[$quarter]['total_students'] += $count;
            $quarterData[$quarter]['feedback_counts'][$feedback_id] = $count;
        }
    }
    
    // Calculate average scores for each quarter
    $quarterAverages = [];
    foreach ($quarters as $quarter) {
        $data = $quarterData[$quarter];
        if ($data['total_students'] > 0) {
            // Calculate weighted average based on feedback counts
            $totalScore = 0;
            $totalStudents = 0;
            
            foreach ($data['feedback_counts'] as $feedback_id => $count) {
                // CORRECT mapping: feedback_id to performance score (1-5 scale)
                // visual_feedback_id = 1 → "Excellent" (score = 5)
                // visual_feedback_id = 2 → "Very Good" (score = 4)
                // visual_feedback_id = 3 → "Good" (score = 3)
                // visual_feedback_id = 4 → "Need Help" (score = 2)
                // visual_feedback_id = 5 → "Not Met" (score = 1)
                $score = 6 - intval($feedback_id); // Convert: 1→5, 2→4, 3→3, 4→2, 5→1
                $totalScore += ($score * $count);
                $totalStudents += $count;
            }
            
            $average = $totalStudents > 0 ? round($totalScore / $totalStudents, 2) : 0;
            $quarterAverages[] = $average;
        } else {
            $quarterAverages[] = 0; // No data for this quarter
        }
    }
    
    echo json_encode([
        "status" => "success",
        "data" => [
            "labels" => ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
            "scores" => $quarterAverages,
            "quarter_details" => $quarterData
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?> 