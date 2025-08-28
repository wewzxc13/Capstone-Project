<?php
// Simple test for the risk count API
require_once __DIR__ . '/../connection.php';

echo "<h2>Testing Student Risk Count API</h2>";

// Test with a sample teacher ID (you may need to adjust this)
$teacher_id = 5; // Teacher ID 5 (Jessa Hambora Decena) from the database

echo "<p>Testing with teacher_id: $teacher_id</p>";

try {
    // First, get the advisory details for this teacher
    $advisoryStmt = $conn->prepare("
        SELECT advisory_id, level_id 
        FROM tbl_advisory 
        WHERE lead_teacher_id = ? OR assistant_teacher_id = ? 
        LIMIT 1
    ");
    $advisoryStmt->execute([$teacher_id, $teacher_id]);
    $advisory = $advisoryStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$advisory) {
        echo "<p style='color: red;'>No advisory found for teacher_id: $teacher_id</p>";
        exit();
    }
    
    echo "<p>Found advisory_id: {$advisory['advisory_id']}, level_id: {$advisory['level_id']}</p>";
    
    // Get all students in this advisory/level
    $studentsStmt = $conn->prepare("
        SELECT student_id 
        FROM tbl_students 
        WHERE level_id = ? AND stud_school_status = 'Active'
    ");
    $studentsStmt->execute([$advisory['level_id']]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p>Found " . count($students) . " active students</p>";
    
    if (empty($students)) {
        echo "<p style='color: orange;'>No active students found</p>";
        exit();
    }
    
    $riskCount = 0;
    $advisory_id = $advisory['advisory_id'];
    
    echo "<h3>Checking each student:</h3>";
    
    // Check each student
    foreach ($students as $student) {
        $student_id = $student['student_id'];
        
        echo "<p>Student ID: $student_id</p>";
        
        // Check if student has completed all quarters (4 quarters)
        $quartersStmt = $conn->prepare("
            SELECT COUNT(DISTINCT quarter_id) as quarter_count 
            FROM tbl_progress_cards 
            WHERE student_id = ? AND advisory_id = ? AND is_finalized = 1
        ");
        $quartersStmt->execute([$student_id, $advisory_id]);
        $quarterResult = $quartersStmt->fetch(PDO::FETCH_ASSOC);
        $completedQuarters = $quarterResult['quarter_count'] ?? 0;
        
        echo "<p>  - Completed quarters: $completedQuarters</p>";
        
        if ($completedQuarters >= 4) {
            // Student completed all quarters - check overall progress
            $overallStmt = $conn->prepare("
                SELECT risk_id 
                FROM tbl_overall_progress 
                WHERE student_id = ? AND advisory_id = ? 
                ORDER BY overall_progress_id DESC 
                LIMIT 1
            ");
            $overallStmt->execute([$student_id, $advisory_id]);
            $overallResult = $overallStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($overallResult && $overallResult['risk_id'] == 3) {
                $riskCount++;
                echo "<p style='color: red;'>  - HIGH RISK (overall progress)</p>";
            } else {
                echo "<p>  - Risk level: " . ($overallResult['risk_id'] ?? 'No data') . " (overall progress)</p>";
            }
        } else {
            // Student hasn't completed all quarters - check latest progress card
            $cardStmt = $conn->prepare("
                SELECT risk_id 
                FROM tbl_progress_cards 
                WHERE student_id = ? AND advisory_id = ? 
                ORDER BY quarter_id DESC, card_id DESC 
                LIMIT 1
            ");
            $cardStmt->execute([$student_id, $advisory_id]);
            $cardResult = $cardStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($cardResult && $cardResult['risk_id'] == 3) {
                $riskCount++;
                echo "<p style='color: red;'>  - HIGH RISK (progress card)</p>";
            } else {
                echo "<p>  - Risk level: " . ($cardResult['risk_id'] ?? 'No data') . " (progress card)</p>";
            }
        }
    }
    
    echo "<h3>Final Results:</h3>";
    echo "<p>Total students: " . count($students) . "</p>";
    echo "<p style='color: red; font-weight: bold;'>Students at risk (risk_id = 3): $riskCount</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database error: " . $e->getMessage() . "</p>";
}
?> 