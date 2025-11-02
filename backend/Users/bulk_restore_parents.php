<?php
// Bulk restore parents and their linked students
// - Restores multiple parents by setting status to 'Active'
// - For each parent, restores all linked students by setting stud_school_status to 'Active'
// - Keeps the relationship intact (parent_id and parent_profile_id remain linked)

// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST requests are allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['parent_ids']) || !is_array($data['parent_ids'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Parent IDs array is required']);
    exit;
}

$parentIds = array_map('intval', $data['parent_ids']);
$editorId = isset($data['editor_id']) ? intval($data['editor_id']) : null;

// Validate parent IDs
if (empty($parentIds)) {
    http_response_code(400);
    echo json_encode(['message' => 'At least one parent ID is required']);
    exit;
}

// Log the incoming data for debugging
$debugMessage = date('Y-m-d H:i:s') . " - Bulk restore request for parents: " . json_encode($parentIds) . "\n";
file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

try {
    $conn->beginTransaction();
    
    $restoredParents = [];
    $restoredStudents = [];
    $failedParents = [];
    
    // Process each parent
    foreach ($parentIds as $parentId) {
        try {
            // Verify that this is a parent (user_role = 4)
            $roleCheck = $conn->prepare("SELECT user_id, user_role, user_status FROM tbl_users WHERE user_id = ? AND user_role = 4");
            $roleCheck->execute([$parentId]);
            $parent = $roleCheck->fetch(PDO::FETCH_ASSOC);
            
            if (!$parent) {
                $failedParents[] = [
                    'parent_id' => $parentId,
                    'reason' => 'Not found or not a parent'
                ];
                continue;
            }
            
            // Skip if already active
            if ($parent['user_status'] === 'Active') {
                // Still get students count for reporting
                $studentsQuery = $conn->prepare("SELECT COUNT(*) as count FROM tbl_students WHERE parent_id = ?");
                $studentsQuery->execute([$parentId]);
                $studentsCount = $studentsQuery->fetch(PDO::FETCH_ASSOC)['count'];
                
                $restoredParents[] = [
                    'parent_id' => $parentId,
                    'students_restored' => 0,
                    'note' => 'Already active'
                ];
                continue;
            }
            
            // Get all students linked to this parent (including inactive ones)
            $studentsQuery = $conn->prepare("
                SELECT student_id 
                FROM tbl_students 
                WHERE parent_id = ? AND stud_school_status = 'Inactive'
            ");
            $studentsQuery->execute([$parentId]);
            $linkedStudents = $studentsQuery->fetchAll(PDO::FETCH_ASSOC);
            
            $studentIds = array_column($linkedStudents, 'student_id');
            $restoredStudentsCount = 0;
            
            // Restore linked students (keep relationship intact - do NOT unlink)
            if (!empty($studentIds)) {
                $placeholders = str_repeat('?,', count($studentIds) - 1) . '?';
                $updateStudents = $conn->prepare("
                    UPDATE tbl_students 
                    SET stud_school_status = 'Active'
                    WHERE student_id IN ($placeholders) AND stud_school_status = 'Inactive'
                ");
                $updateStudents->execute($studentIds);
                $restoredStudentsCount = $updateStudents->rowCount();
            }
            
            // Restore the parent
            $restoreParent = $conn->prepare("UPDATE tbl_users SET user_status = 'Active' WHERE user_id = ?");
            $restoreParent->execute([$parentId]);
            
            if ($restoreParent->rowCount() === 0) {
                throw new Exception("Failed to restore parent $parentId");
            }
            
            $restoredParents[] = [
                'parent_id' => $parentId,
                'students_restored' => $restoredStudentsCount
            ];
            
            // Log system action for this parent
            if ($editorId) {
                $action = "Bulk restored a parent account and {$restoredStudentsCount} linked student(s).";
                
                $logQuery = $conn->prepare("
                    INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
                    VALUES (:user_id, :target_user_id, :target_student_id, :action, NOW())
                ");
                
                $logQuery->bindParam(":user_id", $editorId, PDO::PARAM_INT);
                $logQuery->bindParam(":target_user_id", $parentId, PDO::PARAM_INT);
                $logQuery->bindValue(":target_student_id", null, PDO::PARAM_NULL);
                $logQuery->bindParam(":action", $action, PDO::PARAM_STR);
                $logQuery->execute();
            }
            
            // Log successful restore
            $successMessage = date('Y-m-d H:i:s') . " - Successfully bulk restored parent $parentId with $restoredStudentsCount student(s)\n";
            file_put_contents('../SystemLogs/debug_log.txt', $successMessage, FILE_APPEND);
            
        } catch (Exception $e) {
            $failedParents[] = [
                'parent_id' => $parentId,
                'reason' => $e->getMessage()
            ];
            error_log("Failed to restore parent $parentId: " . $e->getMessage());
        }
    }
    
    $conn->commit();
    
    // Calculate totals
    $totalRestored = count($restoredParents);
    $totalStudentsRestored = array_sum(array_column($restoredParents, 'students_restored'));
    $totalFailed = count($failedParents);
    
    // Prepare success message
    $message = "Successfully restored $totalRestored parent(s) and $totalStudentsRestored linked student(s).";
    if ($totalFailed > 0) {
        $message .= " Failed to restore $totalFailed parent(s).";
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'data' => [
            'total_restored' => $totalRestored,
            'total_students_restored' => $totalStudentsRestored,
            'total_failed' => $totalFailed,
            'restored_parents' => $restoredParents,
            'failed_parents' => $failedParents
        ]
    ]);
    
} catch (Exception $e) {
    $conn->rollBack();
    
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in bulk_restore_parents.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?>

