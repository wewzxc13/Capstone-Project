<?php
/**
 * Test script to verify the new tracking system with separate level tables
 */

require_once '../connection.php';
require_once 'tracking_helper.php';

header('Content-Type: application/json');

echo "Testing Tracking System with Separate Level Tables\n";
echo "================================================\n\n";

try {
    // Test 1: Get tracking table names
    echo "Test 1: Getting tracking table names\n";
    echo "Level 1 (Discoverer): " . getTrackingTableName(1) . "\n";
    echo "Level 2 (Explorer): " . getTrackingTableName(2) . "\n";
    echo "Level 3 (Adventurer): " . getTrackingTableName(3) . "\n";
    echo "Invalid level (4): " . (getTrackingTableName(4) ?? 'null') . "\n\n";

    // Test 2: Get a sample student's level
    echo "Test 2: Getting student level\n";
    $stmt = $conn->prepare('SELECT student_id, level_id FROM tbl_students LIMIT 1');
    $stmt->execute();
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($student) {
        echo "Sample student ID: " . $student['student_id'] . "\n";
        echo "Student level_id: " . $student['level_id'] . "\n";
        echo "Expected tracking table: " . getTrackingTableName($student['level_id']) . "\n\n";
        
        // Test 3: Test getting student level via helper function
        echo "Test 3: Getting student level via helper function\n";
        $level_id = getStudentLevelId($conn, $student['student_id']);
        echo "Helper function result: " . $level_id . "\n\n";
        
        // Test 4: Test tracking record operations
        echo "Test 4: Testing tracking record operations\n";
        
        // Get a sample activity
        $stmt = $conn->prepare('SELECT activity_id FROM tbl_activities LIMIT 1');
        $stmt->execute();
        $activity = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($activity) {
            echo "Sample activity ID: " . $activity['activity_id'] . "\n";
            
            // Check if tracking record exists
            $exists = trackingRecordExists($conn, $student['student_id'], $activity['activity_id']);
            echo "Tracking record exists: " . ($exists ? 'Yes' : 'No') . "\n";
            
            // Test getting tracking data
            $tracking = getStudentActivityTracking($conn, $student['student_id'], $activity['activity_id']);
            echo "Tracking data: " . ($tracking ? json_encode($tracking) : 'null') . "\n\n";
        }
    }
    
    // Test 5: Test getting tracking data from all tables
    echo "Test 5: Testing getTrackingData function\n";
    $stmt = $conn->prepare('SELECT student_id FROM tbl_students LIMIT 3');
    $stmt->execute();
    $studentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $stmt = $conn->prepare('SELECT activity_id FROM tbl_activities LIMIT 3');
    $stmt->execute();
    $activityIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Student IDs: " . implode(', ', $studentIds) . "\n";
    echo "Activity IDs: " . implode(', ', $activityIds) . "\n";
    
    $trackingData = getTrackingData($conn, $studentIds, $activityIds);
    echo "Total tracking records found: " . count($trackingData) . "\n";
    
    if (!empty($trackingData)) {
        echo "Sample tracking record: " . json_encode($trackingData[0]) . "\n";
    }
    
    echo "\nAll tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 