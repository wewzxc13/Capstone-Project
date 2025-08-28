<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$teacher_id = isset($input['teacher_id']) ? intval($input['teacher_id']) : null;

if (!$teacher_id) {
    echo json_encode(["status" => "error", "message" => "Teacher ID is required"]);
    exit();
}

try {
    // First, get the advisory details for this teacher
    $advisoryStmt = $conn->prepare("
        SELECT advisory_id, level_id 
        FROM tbl_advisory 
        WHERE lead_teacher_id = ? OR assistant_teacher_id = ? 
        LIMIT 1
    ");
    $advisoryStmt->execute([$teacher_id, $teacher_id]);
    $advisory = $advisoryStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$advisory) {
        echo json_encode(["status" => "success", "count" => 0, "message" => "No advisory found for this teacher"]);
        exit();
    }
    
    // Get all students in this advisory/level
    $studentsStmt = $conn->prepare("
        SELECT student_id 
        FROM tbl_students 
        WHERE level_id = ? AND stud_school_status = 'Active'
    ");
    $studentsStmt->execute([$advisory['level_id']]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($students)) {
        echo json_encode(["status" => "success", "count" => 0, "message" => "No active students found"]);
        exit();
    }
    
    $riskCount = 0;
    $advisory_id = $advisory['advisory_id'];
    
    // Check each student
    foreach ($students as $student) {
        $student_id = $student['student_id'];
        
        // Check if student has completed all quarters (4 quarters)
        $quartersStmt = $conn->prepare("
            SELECT COUNT(DISTINCT quarter_id) as quarter_count 
            FROM tbl_progress_cards 
            WHERE student_id = ? AND advisory_id = ? AND is_finalized = 1
        ");
        $quartersStmt->execute([$student_id, $advisory_id]);
        $quarterResult = $quartersStmt->fetch(PDO::FETCH_ASSOC);
        $completedQuarters = $quarterResult['quarter_count'] ?? 0;
        
        $isAtRisk = false;
        
        // First, check if student has overall progress
        $overallStmt = $conn->prepare("
            SELECT risk_id 
            FROM tbl_overall_progress 
            WHERE student_id = ? AND advisory_id = ? 
            ORDER BY overall_progress_id DESC 
            LIMIT 1
        ");
        $overallStmt->execute([$student_id, $advisory_id]);
        $overallResult = $overallStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($overallResult) {
            // Student has overall progress - only check overall progress
            if ($overallResult['risk_id'] == 3) {
                $isAtRisk = true;
            }
        } else {
            // Student has NO overall progress - check individual quarters for any high risk
            $anyHighRiskStmt = $conn->prepare("
                SELECT COUNT(*) as high_risk_count 
                FROM tbl_progress_cards 
                WHERE student_id = ? AND advisory_id = ? AND risk_id = 3
            ");
            $anyHighRiskStmt->execute([$student_id, $advisory_id]);
            $anyHighRiskResult = $anyHighRiskStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($anyHighRiskResult && $anyHighRiskResult['high_risk_count'] > 0) {
                $isAtRisk = true;
            }
        }
        
        if ($isAtRisk) {
            $riskCount++;
        }
    }
    
    echo json_encode([
        "status" => "success", 
        "count" => $riskCount,
        "total_students" => count($students),
        "advisory_id" => $advisory_id
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_students_at_risk_count.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Database error occurred",
        "error" => $e->getMessage()
    ]);
}
?> 