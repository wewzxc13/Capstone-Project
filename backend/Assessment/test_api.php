<?php
// Simple test for the API endpoint
require_once __DIR__ . '/../connection.php';

echo "<h2>Testing API Endpoint</h2>";

// Test data
$testData = [
    'teacher_id' => 5  // Jessa Hambora Decena
];

echo "<p>Testing with teacher_id: {$testData['teacher_id']}</p>";
echo "<p>New Logic: Check overall progress first, if none exists then check individual quarters</p>";

// Simulate the API call
$teacher_id = $testData['teacher_id'];

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
        echo "<p>Available advisories:</p>";
        
        // Show all advisories for debugging
        $allAdvisoryStmt = $conn->prepare("SELECT * FROM tbl_advisory");
        $allAdvisoryStmt->execute();
        $allAdvisories = $allAdvisoryStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>advisory_id</th><th>level_id</th><th>lead_teacher_id</th><th>assistant_teacher_id</th></tr>";
        foreach ($allAdvisories as $adv) {
            echo "<tr>";
            echo "<td>{$adv['advisory_id']}</td>";
            echo "<td>{$adv['level_id']}</td>";
            echo "<td>{$adv['lead_teacher_id']}</td>";
            echo "<td>{$adv['assistant_teacher_id']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        exit();
    }
    
    echo "<p style='color: green;'>Found advisory_id: {$advisory['advisory_id']}, level_id: {$advisory['level_id']}</p>";
    
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
        
        $isAtRisk = false;
        
        // First, check if student has overall progress
        $overallStmt = $conn->prepare("
            SELECT risk_id 
            FROM tbl_overall_progress 
            WHERE student_id = ? AND advisory_id = ? 
            ORDER BY overall_progress_id DESC 
            LIMIT 1
        ");
        $overallStmt->execute([$student_id, $advisory_id]);
        $overallResult = $overallStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($overallResult) {
            // Student has overall progress - only check overall progress
            if ($overallResult['risk_id'] == 3) {
                $isAtRisk = true;
                echo "<p style='color: red;'>  - HIGH RISK (overall progress)</p>";
            } else {
                echo "<p>  - Risk level: " . ($overallResult['risk_id'] ?? 'No data') . " (overall progress)</p>";
            }
        } else {
            // Student has NO overall progress - check individual quarters for any high risk
            $anyHighRiskStmt = $conn->prepare("
                SELECT COUNT(*) as high_risk_count 
                FROM tbl_progress_cards 
                WHERE student_id = ? AND advisory_id = ? AND risk_id = 3
            ");
            $anyHighRiskStmt->execute([$student_id, $advisory_id]);
            $anyHighRiskResult = $anyHighRiskStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($anyHighRiskResult && $anyHighRiskResult['high_risk_count'] > 0) {
                $isAtRisk = true;
                echo "<p style='color: red;'>  - HIGH RISK (found {$anyHighRiskResult['high_risk_count']} quarter(s) with high risk)</p>";
            } else {
                echo "<p>  - No quarters with high risk found</p>";
            }
        }
        
        if ($isAtRisk) {
            $riskCount++;
        }
    }
    
    echo "<h3>Final Results:</h3>";
    echo "<p>Total students: " . count($students) . "</p>";
    echo "<p style='color: red; font-weight: bold;'>Students at risk (risk_id = 3): $riskCount</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database error: " . $e->getMessage() . "</p>";
}
?> 