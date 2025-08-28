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
        
        // Get quarterly performance data for this advisory using quarter_avg_score (actual averages)
        $stmt = $conn->prepare('
            SELECT 
                pc.quarter_id,
                AVG(pc.quarter_avg_score) as class_avg_score,
                COUNT(*) as student_count
            FROM tbl_progress_cards pc
            WHERE pc.advisory_id = ? AND pc.quarter_avg_score IS NOT NULL
            GROUP BY pc.quarter_id
            ORDER BY pc.quarter_id
        ');
        $stmt->execute([$advisory_id]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Initialize quarters data for this class
        $quarters = [1, 2, 3, 4];
        $quarterAverages = [null, null, null, null]; // Initialize with nulls
        
        // Process the results for this class
        foreach ($results as $row) {
            $quarter = $row['quarter_id'];
            $class_avg_score = $row['class_avg_score'];
            $student_count = $row['student_count'];
            
            if ($student_count > 0) {
                $quarterAverages[$quarter - 1] = round($class_avg_score, 2); // quarter_id is 1-based, array is 0-based
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