<?php
require_once __DIR__ . '/../connection.php';

echo "<h2>Simple API Test</h2>";

$teacher_id = 5; // Jessa Hambora Decena

echo "<p>Testing teacher_id: $teacher_id</p>";

try {
    // Test the advisory query
    $stmt = $conn->prepare("
        SELECT advisory_id, level_id 
        FROM tbl_advisory 
        WHERE lead_teacher_id = ? OR assistant_teacher_id = ? 
        LIMIT 1
    ");
    $stmt->execute([$teacher_id, $teacher_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "<p style='color: green;'>SUCCESS: Found advisory_id: {$result['advisory_id']}, level_id: {$result['level_id']}</p>";
        
        // Test the students query
        $studentStmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM tbl_students 
            WHERE level_id = ? AND stud_school_status = 'Active'
        ");
        $studentStmt->execute([$result['level_id']]);
        $studentCount = $studentStmt->fetch(PDO::FETCH_ASSOC);
        
        echo "<p>Active students in this level: {$studentCount['count']}</p>";
        
    } else {
        echo "<p style='color: red;'>ERROR: No advisory found for teacher_id: $teacher_id</p>";
        
        // Show all advisories for debugging
        $allStmt = $conn->prepare("SELECT * FROM tbl_advisory");
        $allStmt->execute();
        $all = $allStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>All advisories:</p>";
        echo "<pre>";
        print_r($all);
        echo "</pre>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database error: " . $e->getMessage() . "</p>";
}
?> 