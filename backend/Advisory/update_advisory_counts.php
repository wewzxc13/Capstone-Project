<?php
// Dynamic CORS for localhost:3000+
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // If specific advisory_id is provided, update only that one
    if (isset($data['advisory_id'])) {
        $advisoryId = intval($data['advisory_id']);
        
        // Get counts for specific advisory
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
        
        // Update specific advisory
        $conn->prepare("UPDATE tbl_advisory SET total_male = ?, total_female = ?, total_students = ? WHERE advisory_id = ?")->execute([
            $counts['male_count'],
            $counts['female_count'],
            $counts['male_count'] + $counts['female_count'],
            $advisoryId
        ]);
        
        echo json_encode([
            'status' => 'success', 
            'message' => "Advisory $advisoryId counts updated successfully",
            'advisory_id' => $advisoryId,
            'counts' => $counts
        ]);
        
    } else {
        // If no specific advisory_id, update all advisories (for bulk operations)
        $stmt = $conn->prepare("SELECT advisory_id FROM tbl_advisory WHERE level_id IS NOT NULL");
        $stmt->execute();
        $advisories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $updatedCount = 0;
        foreach ($advisories as $advisory) {
            $advisoryId = $advisory['advisory_id'];
            
            // Get counts for this advisory
            $stmt2 = $conn->prepare("
                SELECT 
                    COUNT(CASE WHEN LOWER(s.stud_gender) = 'male' THEN 1 END) as male_count,
                    COUNT(CASE WHEN LOWER(s.stud_gender) = 'female' THEN 1 END) as female_count
                FROM tbl_student_assigned sa
                JOIN tbl_students s ON sa.student_id = s.student_id
                WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active'
            ");
            $stmt2->execute([$advisoryId]);
            $counts = $stmt2->fetch(PDO::FETCH_ASSOC);
            
            // Update advisory counts
            $conn->prepare("UPDATE tbl_advisory SET total_male = ?, total_female = ?, total_students = ? WHERE advisory_id = ?")->execute([
                $counts['male_count'],
                $counts['female_count'],
                $counts['male_count'] + $counts['female_count'],
                $advisoryId
            ]);
            
            $updatedCount++;
        }
        
        echo json_encode([
            'status' => 'success', 
            'message' => "Updated counts for $updatedCount advisories",
            'updated_count' => $updatedCount
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 