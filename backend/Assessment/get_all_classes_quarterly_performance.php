<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

try {
    // Get all advisory classes with their level information
    $stmt = $conn->prepare('
        SELECT 
            a.advisory_id,
            a.level_id,
            sl.level_name
        FROM tbl_advisory a
        LEFT JOIN tbl_student_levels sl ON a.level_id = sl.level_id
        ORDER BY a.level_id
    ');
    $stmt->execute();
    $advisories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $allClassesData = [];
    
    foreach ($advisories as $advisory) {
        $advisory_id = $advisory['advisory_id'];
        $level_id = $advisory['level_id'];
        $level_name = $advisory['level_name'];
        
                 // Get quarterly performance data for this advisory using quarter_visual_feedback_id (same as Teacher Dashboard)
         $stmt = $conn->prepare('
             SELECT 
                 pc.quarter_id,
                 pc.quarter_visual_feedback_id,
                 COUNT(*) as student_count
             FROM tbl_progress_cards pc
             WHERE pc.advisory_id = ?
             GROUP BY pc.quarter_id, pc.quarter_visual_feedback_id
             ORDER BY pc.quarter_id, pc.quarter_visual_feedback_id
         ');
         $stmt->execute([$advisory_id]);
         $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
         
         // Initialize quarters data for this class
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
         
         // Process the results for this class
         foreach ($results as $row) {
             $quarter = $row['quarter_id'];
             $feedback_id = $row['quarter_visual_feedback_id'];
             $count = $row['student_count'];
             
             if (isset($quarterData[$quarter])) {
                 $quarterData[$quarter]['total_students'] += $count;
                 $quarterData[$quarter]['feedback_counts'][$feedback_id] = $count;
             }
         }
         
         // Calculate average scores for each quarter (same logic as Teacher Dashboard)
         $quarterAverages = [null, null, null, null]; // Initialize with nulls
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
                 $quarterAverages[$quarter - 1] = $average; // quarter_id is 1-based, array is 0-based
             }
         }
        
        // Map level_id to class name and color
        $className = '';
        $color = '';
        
        switch ($level_id) {
            case 1:
                $className = 'Discoverer';
                $color = '#5C9EFF'; // Blue
                break;
            case 2:
                $className = 'Explorer';
                $color = '#FDCB44'; // Yellow
                break;
            case 3:
                $className = 'Adventurer';
                $color = '#FF7B7B'; // Red
                break;
            default:
                $className = $level_name || 'Unknown';
                $color = '#6B7280'; // Gray
        }
        
        $allClassesData[] = [
            'class_name' => $className,
            'level_id' => $level_id,
            'color' => $color,
            'data' => $quarterAverages
        ];
    }
    
    echo json_encode([
        "status" => "success",
        "data" => [
            "labels" => ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
            "classes" => $allClassesData
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?> 