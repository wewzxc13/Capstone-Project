<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

try {
    // Start transaction
    $conn->beginTransaction();
    
    // Find duplicate records
    $stmt = $conn->prepare("
        SELECT 
            student_id, 
            attendance_date, 
            session, 
            COUNT(*) as count,
            GROUP_CONCAT(attendance_id ORDER BY recorded_at DESC) as attendance_ids
        FROM tbl_attendance 
        GROUP BY student_id, attendance_date, session 
        HAVING COUNT(*) > 1
        ORDER BY student_id, attendance_date
    ");
    $stmt->execute();
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $deletedCount = 0;
    $duplicateGroups = [];
    
    foreach ($duplicates as $duplicate) {
        $attendanceIds = explode(',', $duplicate['attendance_ids']);
        
        // Keep the most recent record (first in the list since we ordered by recorded_at DESC)
        $keepId = $attendanceIds[0];
        $deleteIds = array_slice($attendanceIds, 1);
        
        if (!empty($deleteIds)) {
            $placeholders = str_repeat('?,', count($deleteIds) - 1) . '?';
            $stmt = $conn->prepare("DELETE FROM tbl_attendance WHERE attendance_id IN ($placeholders)");
            $stmt->execute($deleteIds);
            $deletedCount += count($deleteIds);
            
            $duplicateGroups[] = [
                'student_id' => $duplicate['student_id'],
                'date' => $duplicate['attendance_date'],
                'session' => $duplicate['session'],
                'total_records' => $duplicate['count'],
                'kept_record' => $keepId,
                'deleted_records' => $deleteIds
            ];
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Duplicate attendance records cleaned up successfully',
        'summary' => [
            'total_duplicate_groups' => count($duplicateGroups),
            'total_records_deleted' => $deletedCount
        ],
        'details' => $duplicateGroups
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    $conn->rollBack();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error during cleanup', 
        'error' => $e->getMessage()
    ]);
}
?> 