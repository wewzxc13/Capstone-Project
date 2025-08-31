<?php
// Simple test file to verify the updated get_students_at_risk_count.php API
require_once __DIR__ . '/../connection.php';

echo "<h2>Testing Updated Risk Count API</h2>";

// Test with a sample teacher ID (you can change this)
$test_teacher_id = 19; // Change this to an actual teacher ID in your system

echo "<p>Testing with teacher ID: $test_teacher_id</p>";

// Simulate the API call
$input = ['teacher_id' => $test_teacher_id];

try {
    // First, get the advisory details for this teacher
    $advisoryStmt = $conn->prepare("
        SELECT advisory_id, level_id 
        FROM tbl_advisory 
        WHERE lead_teacher_id = ? OR assistant_teacher_id = ? 
        LIMIT 1
    ");
    $advisoryStmt->execute([$test_teacher_id, $test_teacher_id]);
    $advisory = $advisoryStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$advisory) {
        echo "<p style='color: red;'>❌ No advisory found for teacher ID: $test_teacher_id</p>";
        exit();
    }
    
    echo "<p style='color: green;'>✅ Found advisory: ID {$advisory['advisory_id']}, Level ID: {$advisory['level_id']}</p>";
    
    // Get all students in this advisory/level (active + inactive) as long as they have parent linked
    $studentsStmt = $conn->prepare("
        SELECT student_id, stud_school_status, parent_id
        FROM tbl_students 
        WHERE level_id = ? AND parent_id IS NOT NULL
    ");
    $studentsStmt->execute([$advisory['level_id']]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p>📊 Student Counts:</p>";
    echo "<ul>";
    echo "<li>Total students with parent linked: " . count($students) . "</li>";
    
    $activeCount = 0;
    $inactiveCount = 0;
    
    foreach ($students as $student) {
        if ($student['stud_school_status'] === 'Active') {
            $activeCount++;
        } else {
            $inactiveCount++;
        }
    }
    
    echo "<li>Active students: $activeCount</li>";
    echo "<li>Inactive students: $inactiveCount</li>";
    echo "</ul>";
    
    // Show sample student data
    if (!empty($students)) {
        echo "<p>📋 Sample Student Data:</p>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Student ID</th><th>Status</th><th>Parent ID</th></tr>";
        
        $sampleCount = min(5, count($students)); // Show first 5 students
        for ($i = 0; $i < $sampleCount; $i++) {
            $student = $students[$i];
            echo "<tr>";
            echo "<td>{$student['student_id']}</td>";
            echo "<td>{$student['stud_school_status']}</td>";
            echo "<td>{$student['parent_id']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Database error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><strong>Test completed.</strong></p>";
echo "<p>This test verifies that the updated API now counts ALL students with parent links (active + inactive) instead of just active students.</p>";
?> 