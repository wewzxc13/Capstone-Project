<?php
/**
 * Helper functions for handling tracking operations across different class level tables
 */

/**
 * Get the tracking table name based on student's level_id
 * @param int $level_id Student's level_id (1=Discoverer, 2=Explorer, 3=Adventurer)
 * @return string|null The tracking table name or null if invalid level
 */
function getTrackingTableName($level_id) {
    switch ($level_id) {
        case 1:
            return 'tbl_tracking_discoverer';
        case 2:
            return 'tbl_tracking_explorer';
        case 3:
            return 'tbl_tracking_adventurer';
        default:
            return null;
    }
}

/**
 * Get student's level_id from database
 * @param PDO $conn Database connection
 * @param int $student_id Student ID
 * @return int|null Student's level_id or null if not found
 */
function getStudentLevelId($conn, $student_id) {
    $stmt = $conn->prepare('SELECT level_id FROM tbl_students WHERE student_id = ?');
    $stmt->execute([$student_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result ? $result['level_id'] : null;
}

/**
 * Insert tracking record into the appropriate table based on student's level
 * @param PDO $conn Database connection
 * @param int $student_id Student ID
 * @param int $activity_id Activity ID
 * @param int|null $visual_feedback_id Visual feedback ID (optional)
 * @return bool Success status
 */
function insertTrackingRecord($conn, $student_id, $activity_id, $visual_feedback_id = null) {
    $level_id = getStudentLevelId($conn, $student_id);
    if (!$level_id) {
        return false; // Student not found or no level assigned
    }
    
    $table_name = getTrackingTableName($level_id);
    if (!$table_name) {
        return false; // Invalid level
    }
    
    if ($visual_feedback_id) {
        $stmt = $conn->prepare("INSERT INTO $table_name (student_id, activity_id, visual_feedback_id) VALUES (?, ?, ?)");
        return $stmt->execute([$student_id, $activity_id, $visual_feedback_id]);
    } else {
        $stmt = $conn->prepare("INSERT INTO $table_name (student_id, activity_id) VALUES (?, ?)");
        return $stmt->execute([$student_id, $activity_id]);
    }
}

/**
 * Update tracking record in the appropriate table based on student's level
 * @param PDO $conn Database connection
 * @param int $student_id Student ID
 * @param int $activity_id Activity ID
 * @param int $visual_feedback_id Visual feedback ID
 * @return bool Success status
 */
function updateTrackingRecord($conn, $student_id, $activity_id, $visual_feedback_id) {
    $level_id = getStudentLevelId($conn, $student_id);
    if (!$level_id) {
        return false; // Student not found or no level assigned
    }
    
    $table_name = getTrackingTableName($level_id);
    if (!$table_name) {
        return false; // Invalid level
    }
    
    $stmt = $conn->prepare("UPDATE $table_name SET visual_feedback_id = ? WHERE student_id = ? AND activity_id = ?");
    return $stmt->execute([$visual_feedback_id, $student_id, $activity_id]);
}

/**
 * Check if tracking record exists in the appropriate table based on student's level
 * @param PDO $conn Database connection
 * @param int $student_id Student ID
 * @param int $activity_id Activity ID
 * @return bool True if record exists
 */
function trackingRecordExists($conn, $student_id, $activity_id) {
    $level_id = getStudentLevelId($conn, $student_id);
    if (!$level_id) {
        return false; // Student not found or no level assigned
    }
    
    $table_name = getTrackingTableName($level_id);
    if (!$table_name) {
        return false; // Invalid level
    }
    
    $stmt = $conn->prepare("SELECT COUNT(*) FROM $table_name WHERE student_id = ? AND activity_id = ?");
    $stmt->execute([$student_id, $activity_id]);
    return $stmt->fetchColumn() > 0;
}

/**
 * Get tracking data from all level tables for given students and activities
 * @param PDO $conn Database connection
 * @param array $studentIds Array of student IDs
 * @param array $activityIds Array of activity IDs
 * @return array Tracking data
 */
function getTrackingData($conn, $studentIds, $activityIds) {
    if (empty($studentIds) || empty($activityIds)) {
        return [];
    }
    
    $tracking = [];
    $tables = ['tbl_tracking_discoverer', 'tbl_tracking_explorer', 'tbl_tracking_adventurer'];
    
    $inStudents = implode(',', array_fill(0, count($studentIds), '?'));
    $inActivities = implode(',', array_fill(0, count($activityIds), '?'));
    $params = array_merge($activityIds, $studentIds);
    
    foreach ($tables as $table) {
        $sql = "SELECT t.tracking_id, t.student_id, t.activity_id, t.visual_feedback_id, vf.visual_feedback_shape
                FROM $table t
                LEFT JOIN tbl_visual_feedback vf ON t.visual_feedback_id = vf.visual_feedback_id
                WHERE t.activity_id IN ($inActivities) AND t.student_id IN ($inStudents)";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $tableData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $tracking = array_merge($tracking, $tableData);
    }
    
    return $tracking;
}

/**
 * Get tracking data for a specific student and activity from the appropriate table
 * @param PDO $conn Database connection
 * @param int $student_id Student ID
 * @param int $activity_id Activity ID
 * @return array|null Tracking data or null if not found
 */
function getStudentActivityTracking($conn, $student_id, $activity_id) {
    $level_id = getStudentLevelId($conn, $student_id);
    if (!$level_id) {
        return null; // Student not found or no level assigned
    }
    
    $table_name = getTrackingTableName($level_id);
    if (!$table_name) {
        return null; // Invalid level
    }
    
    $sql = "SELECT t.tracking_id, t.student_id, t.activity_id, t.visual_feedback_id, vf.visual_feedback_shape
            FROM $table_name t
            LEFT JOIN tbl_visual_feedback vf ON t.visual_feedback_id = vf.visual_feedback_id
            WHERE t.student_id = ? AND t.activity_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$student_id, $activity_id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?> 