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

if (!isset($data['student_id'], $data['parent_id'], $data['parent_profile_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

$studentId = intval($data['student_id']);
$parentId = intval($data['parent_id']);
$parentProfileId = intval($data['parent_profile_id']);

try {
    // Start transaction to ensure data consistency
    $conn->beginTransaction();
    
    // Update student's parent information
    $stmt = $conn->prepare("UPDATE tbl_students SET parent_id = ?, parent_profile_id = ? WHERE student_id = ?");
    $stmt->execute([$parentId, $parentProfileId, $studentId]);

    // Get student's level information
    $stmt = $conn->prepare("SELECT level_id, stud_gender FROM tbl_students WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($student && $student['level_id']) {
        $levelId = $student['level_id'];
        $studentGender = $student['stud_gender'];
        
        // Find the advisory for this level
        $stmt = $conn->prepare("SELECT advisory_id FROM tbl_advisory WHERE level_id = ? LIMIT 1");
        $stmt->execute([$levelId]);
        $advisory = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($advisory && $advisory['advisory_id']) {
            $advisoryId = $advisory['advisory_id'];
            
            // Remove any previous assignment for this specific student
            $conn->prepare("DELETE FROM tbl_student_assigned WHERE student_id = ?")->execute([$studentId]);
            
            // Assign student to advisory
            $conn->prepare("INSERT INTO tbl_student_assigned (advisory_id, student_id) VALUES (?, ?)")->execute([$advisoryId, $studentId]);
            
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
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode(['status' => 'success', 'message' => 'Student linked to parent and assigned to advisory successfully']);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($conn->inTransaction()) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 