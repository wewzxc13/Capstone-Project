<?php
// Bulk archive parents and their linked students
// - Archives multiple parents by setting status to 'Inactive'
// - For each parent, archives all linked students by setting stud_school_status to 'Inactive'
// - Keeps the relationship intact (parent_id and parent_profile_id remain linked even when archived)

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
$debugMessage = date('Y-m-d H:i:s') . " - Bulk archive request for parents: " . json_encode($parentIds) . "\n";
file_put_contents('../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

try {
    $conn->beginTransaction();
    
    $archivedParents = [];
    $archivedStudents = [];
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
            
            // Skip if already archived
            if ($parent['user_status'] === 'Inactive') {
                // Still get students count for reporting
                $studentsQuery = $conn->prepare("SELECT COUNT(*) as count FROM tbl_students WHERE parent_id = ?");
                $studentsQuery->execute([$parentId]);
                $studentsCount = $studentsQuery->fetch(PDO::FETCH_ASSOC)['count'];
                
                $archivedParents[] = [
                    'parent_id' => $parentId,
                    'students_archived' => 0,
                    'note' => 'Already archived'
                ];
                continue;
            }
            
            // Get all students linked to this parent
            $studentsQuery = $conn->prepare("
                SELECT student_id 
                FROM tbl_students 
                WHERE parent_id = ? AND stud_school_status = 'Active'
            ");
            $studentsQuery->execute([$parentId]);
            $linkedStudents = $studentsQuery->fetchAll(PDO::FETCH_ASSOC);
            
            $studentIds = array_column($linkedStudents, 'student_id');
            $archivedStudentsCount = 0;
            
            // Archive linked students (keep relationship intact - do NOT unlink)
            if (!empty($studentIds)) {
                $placeholders = str_repeat('?,', count($studentIds) - 1) . '?';
                $updateStudents = $conn->prepare("
                    UPDATE tbl_students 
                    SET stud_school_status = 'Inactive'
                    WHERE student_id IN ($placeholders) AND stud_school_status = 'Active'
                ");
                $updateStudents->execute($studentIds);
                $archivedStudentsCount = $updateStudents->rowCount();
            }
            
            // Archive the parent
            $archiveParent = $conn->prepare("UPDATE tbl_users SET user_status = 'Inactive' WHERE user_id = ?");
            $archiveParent->execute([$parentId]);
            
            if ($archiveParent->rowCount() === 0) {
                throw new Exception("Failed to archive parent $parentId");
            }
            
            $archivedParents[] = [
                'parent_id' => $parentId,
                'students_archived' => $archivedStudentsCount
            ];
            
            // Log system action for this parent
            if ($editorId) {
                $action = "Bulk archived a parent account and {$archivedStudentsCount} linked student(s).";
                
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
            
            // Log successful archive
            $successMessage = date('Y-m-d H:i:s') . " - Successfully bulk archived parent $parentId with $archivedStudentsCount student(s)\n";
            file_put_contents('../SystemLogs/debug_log.txt', $successMessage, FILE_APPEND);
            
        } catch (Exception $e) {
            $failedParents[] = [
                'parent_id' => $parentId,
                'reason' => $e->getMessage()
            ];
            error_log("Failed to archive parent $parentId: " . $e->getMessage());
        }
    }
    
    $conn->commit();
    
    // Calculate totals
    $totalArchived = count($archivedParents);
    $totalStudentsArchived = array_sum(array_column($archivedParents, 'students_archived'));
    $totalFailed = count($failedParents);
    
    // Prepare success message
    $message = "Successfully archived $totalArchived parent(s) and $totalStudentsArchived linked student(s).";
    if ($totalFailed > 0) {
        $message .= " Failed to archive $totalFailed parent(s).";
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'data' => [
            'total_archived' => $totalArchived,
            'total_students_archived' => $totalStudentsArchived,
            'total_failed' => $totalFailed,
            'archived_parents' => $archivedParents,
            'failed_parents' => $failedParents
        ]
    ]);
    
} catch (Exception $e) {
    $conn->rollBack();
    
    // Log the error
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in bulk_archive_parents.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?>

