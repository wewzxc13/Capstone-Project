<?php
/**
 * Migration script to move data from tbl_tracking to level-specific tables
 * Run this script once to migrate existing data
 */

require_once '../connection.php';
require_once 'tracking_helper.php';

header('Content-Type: application/json');

echo "Starting Migration of Tracking Data\n";
echo "==================================\n\n";

try {
    // Check if old table exists
    $stmt = $conn->prepare("SHOW TABLES LIKE 'tbl_tracking'");
    $stmt->execute();
    $oldTableExists = $stmt->rowCount() > 0;
    
    if (!$oldTableExists) {
        echo "Old tbl_tracking table does not exist. Migration not needed.\n";
        exit;
    }
    
    echo "Old tbl_tracking table found. Starting migration...\n\n";
    
    // Get all data from old table
    $stmt = $conn->prepare("SELECT * FROM tbl_tracking");
    $stmt->execute();
    $oldData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($oldData) . " records to migrate.\n\n";
    
    $migratedCount = 0;
    $skippedCount = 0;
    $errorCount = 0;
    
    foreach ($oldData as $record) {
        $student_id = $record['student_id'];
        $activity_id = $record['activity_id'];
        $visual_feedback_id = $record['visual_feedback_id'] ?? null;
        
        // Get student's level
        $level_id = getStudentLevelId($conn, $student_id);
        
        if (!$level_id) {
            echo "Skipping student $student_id: No level assigned\n";
            $skippedCount++;
            continue;
        }
        
        $table_name = getTrackingTableName($level_id);
        if (!$table_name) {
            echo "Skipping student $student_id: Invalid level $level_id\n";
            $skippedCount++;
            continue;
        }
        
        // Check if record already exists in new table
        if (trackingRecordExists($conn, $student_id, $activity_id)) {
            echo "Skipping student $student_id, activity $activity_id: Already exists in $table_name\n";
            $skippedCount++;
            continue;
        }
        
        // Insert into appropriate table
        try {
            if ($visual_feedback_id) {
                $stmt = $conn->prepare("INSERT INTO $table_name (student_id, activity_id, visual_feedback_id) VALUES (?, ?, ?)");
                $stmt->execute([$student_id, $activity_id, $visual_feedback_id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO $table_name (student_id, activity_id) VALUES (?, ?)");
                $stmt->execute([$student_id, $activity_id]);
            }
            
            echo "Migrated: Student $student_id, Activity $activity_id -> $table_name\n";
            $migratedCount++;
            
        } catch (Exception $e) {
            echo "Error migrating student $student_id, activity $activity_id: " . $e->getMessage() . "\n";
            $errorCount++;
        }
    }
    
    echo "\nMigration Summary:\n";
    echo "==================\n";
    echo "Total records processed: " . count($oldData) . "\n";
    echo "Successfully migrated: $migratedCount\n";
    echo "Skipped (already exists): $skippedCount\n";
    echo "Errors: $errorCount\n\n";
    
    if ($migratedCount > 0) {
        echo "Migration completed successfully!\n";
        echo "You can now safely drop the old tbl_tracking table if desired.\n";
    } else {
        echo "No new records were migrated. All data may already be in the new tables.\n";
    }
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?> 