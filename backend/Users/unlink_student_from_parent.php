<?php
include_once '../connection.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['student_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing student_id field']);
    exit;
}

$studentId = intval($data['student_id']);

try {
    // Start transaction to ensure data consistency
    $conn->beginTransaction();
    
    // Get student's current advisory assignment before unlinking
    $stmt = $conn->prepare("SELECT advisory_id FROM tbl_student_assigned WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $currentAssignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Update student's parent information (remove parent link)
    $stmt = $conn->prepare("UPDATE tbl_students SET parent_id = NULL, parent_profile_id = NULL WHERE student_id = ?");
    $stmt->execute([$studentId]);
    
    // Remove student from advisory assignment
    if ($currentAssignment && $currentAssignment['advisory_id']) {
        $advisoryId = $currentAssignment['advisory_id'];
        
        // Remove the specific student assignment
        $conn->prepare("DELETE FROM tbl_student_assigned WHERE student_id = ?")->execute([$studentId]);
        
        // Update gender counts for this advisory only
        $stmt = $conn->prepare("
            SELECT 
                COUNT(CASE WHEN LOWER(s.stud_gender) = 'male' THEN 1 END) as male_count,
                COUNT(CASE WHEN LOWER(s.stud_gender) = 'female' THEN 1 END) as female_count
            FROM tbl_student_assigned sa
            JOIN tbl_students s ON sa.student_id = s.student_id
            WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active'
        ");
        $stmt->execute([$advisoryId]);
        $counts = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Update advisory table with new counts
        $conn->prepare("UPDATE tbl_advisory SET total_male = ?, total_female = ?, total_students = ? WHERE advisory_id = ?")->execute([
            $counts['male_count'],
            $counts['female_count'],
            $counts['male_count'] + $counts['female_count'],
            $advisoryId
        ]);
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode(['status' => 'success', 'message' => 'Student unlinked from parent and removed from advisory successfully']);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($conn->inTransaction()) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 