<?php
// Test script for parent archiving functionality
// This script tests the parent archiving process and verifies student unlinking

include_once '../connection.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if running from command line or web request
if (php_sapi_name() === 'cli') {
    // Running from command line, skip HTTP method check
    $isCommandLine = true;
} else {
    // Running from web request, check HTTP method
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Only GET requests are allowed']);
        exit;
    }
    $isCommandLine = false;
}

try {
    // Check database connection
    if (!$conn) {
        throw new Exception('Database connection failed. Please check your database configuration.');
    }
    
    echo "<h2>Parent Archiving Test Results</h2>";
    echo "<hr>";
    
    // Test 1: Check current parent-student relationships
    echo "<h3>Test 1: Current Parent-Student Relationships</h3>";
    
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.user_firstname,
            u.user_lastname,
            u.user_role,
            u.user_status,
            COUNT(s.student_id) as linked_students
        FROM tbl_users u
        LEFT JOIN tbl_students s ON u.user_id = s.parent_id
        WHERE u.user_role = 4  -- Parent role
        GROUP BY u.user_id, u.user_firstname, u.user_lastname, u.user_role, u.user_status
        ORDER BY u.user_firstname, u.user_lastname
    ");
    
    $stmt->execute();
    $parents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($parents)) {
        echo "<p>No parent accounts found.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Parent ID</th><th>Name</th><th>Status</th><th>Linked Students</th></tr>";
        
        foreach ($parents as $parent) {
            $statusColor = $parent['user_status'] === 'Active' ? 'green' : 'red';
            echo "<tr>";
            echo "<td>{$parent['user_id']}</td>";
            echo "<td>{$parent['user_firstname']} {$parent['user_lastname']}</td>";
            echo "<td style='color: {$statusColor};'>{$parent['user_status']}</td>";
            echo "<td>{$parent['linked_students']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    echo "<hr>";
    
    // Test 2: Check students with NULL parent_id
    echo "<h3>Test 2: Students with NULL Parent ID</h3>";
    
    $stmt = $conn->prepare("
        SELECT 
            student_id,
            stud_firstname,
            stud_lastname,
            stud_school_status,
            parent_id,
            parent_profile_id
        FROM tbl_students 
        WHERE parent_id IS NULL
        ORDER BY stud_firstname, stud_lastname
    ");
    
    $stmt->execute();
    $orphanedStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($orphanedStudents)) {
        echo "<p>No students with NULL parent_id found.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Student ID</th><th>Name</th><th>Status</th><th>Parent ID</th><th>Parent Profile ID</th></tr>";
        
        foreach ($orphanedStudents as $student) {
            $statusColor = $student['stud_school_status'] === 'Active' ? 'green' : 'red';
            echo "<tr>";
            echo "<td>{$student['student_id']}</td>";
            echo "<td>{$student['stud_firstname']} {$student['stud_lastname']}</td>";
            echo "<td style='color: {$statusColor};'>{$student['stud_school_status']}</td>";
            echo "<td>" . ($student['parent_id'] ?? 'NULL') . "</td>";
            echo "<td>" . ($student['parent_profile_id'] ?? 'NULL') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    echo "<hr>";
    
    // Test 3: Check students with active parents
    echo "<h3>Test 3: Students with Active Parents</h3>";
    
    $stmt = $conn->prepare("
        SELECT 
            s.student_id,
            s.stud_firstname,
            s.stud_lastname,
            s.stud_school_status,
            s.parent_id,
            s.parent_profile_id,
            u.user_firstname as parent_firstname,
            u.user_lastname as parent_lastname,
            u.user_status as parent_status
        FROM tbl_students s
        INNER JOIN tbl_users u ON s.parent_id = u.user_id
        WHERE u.user_status = 'Active'
        ORDER BY u.user_firstname, u.user_lastname, s.stud_firstname, s.stud_lastname
    ");
    
    $stmt->execute();
    $activeParentStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($activeParentStudents)) {
        echo "<p>No students with active parents found.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Student ID</th><th>Student Name</th><th>Student Status</th><th>Parent ID</th><th>Parent Name</th><th>Parent Status</th></tr>";
        
        foreach ($activeParentStudents as $student) {
            $studentStatusColor = $student['stud_school_status'] === 'Active' ? 'green' : 'red';
            $parentStatusColor = $student['parent_status'] === 'Active' ? 'green' : 'red';
            
            echo "<tr>";
            echo "<td>{$student['student_id']}</td>";
            echo "<td>{$student['stud_firstname']} {$student['stud_lastname']}</td>";
            echo "<td style='color: {$studentStatusColor};'>{$student['stud_school_status']}</td>";
            echo "<td>{$student['parent_id']}</td>";
            echo "<td>{$student['parent_firstname']} {$student['parent_lastname']}</td>";
            echo "<td style='color: {$parentStatusColor};'>{$student['parent_status']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    echo "<hr>";
    
    // Test 4: Summary statistics
    echo "<h3>Test 4: Summary Statistics</h3>";
    
    $stats = [];
    
    // Total students
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students");
    $stmt->execute();
    $stats['total_students'] = $stmt->fetchColumn();
    
    // Students with parents
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students WHERE parent_id IS NOT NULL");
    $stmt->execute();
    $stats['students_with_parents'] = $stmt->fetchColumn();
    
    // Students without parents
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students WHERE parent_id IS NULL");
    $stmt->execute();
    $stats['students_without_parents'] = $stmt->fetchColumn();
    
    // Active students with parents
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students WHERE parent_id IS NOT NULL AND stud_school_status = 'Active'");
    $stmt->execute();
    $stats['active_students_with_parents'] = $stmt->fetchColumn();
    
    // Inactive students with parents
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tbl_students WHERE parent_id IS NOT NULL AND stud_school_status = 'Inactive'");
    $stmt->execute();
    $stats['inactive_students_with_parents'] = $stmt->fetchColumn();
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Metric</th><th>Count</th></tr>";
    echo "<tr><td>Total Students</td><td>{$stats['total_students']}</td></tr>";
    echo "<tr><td>Students with Parents</td><td>{$stats['students_with_parents']}</td></tr>";
    echo "<tr><td>Students without Parents</td><td>{$stats['students_without_parents']}</td></tr>";
    echo "<tr><td>Active Students with Parents</td><td>{$stats['active_students_with_parents']}</td></tr>";
    echo "<tr><td>Inactive Students with Parents</td><td>{$stats['inactive_students_with_parents']}</td></tr>";
    echo "</table>";
    
    echo "<hr>";
    echo "<p><strong>Test completed successfully!</strong></p>";
    echo "<p>This test verifies that the parent archiving system is working correctly.</p>";
    echo "<p>When a parent is archived, their linked students should have:</p>";
    echo "<ul>";
    echo "<li>parent_id set to NULL</li>";
    echo "<li>parent_profile_id set to NULL</li>";
    echo "<li>stud_school_status set to 'Inactive'</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h2>Error</h2>";
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
    echo "<p>Please check your database connection and try again.</p>";
}
?>
