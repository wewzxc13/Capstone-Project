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
$report_type = isset($input['report_type']) ? $input['report_type'] : 'progress'; // 'progress' or 'subject'

try {
    // Get all active students with their levels
    $studentsStmt = $conn->prepare("
        SELECT 
            s.student_id,
            s.stud_firstname,
            s.stud_lastname,
            s.stud_gender,
            sl.level_name,
            sl.level_id
        FROM tbl_students s
        JOIN tbl_student_levels sl ON s.level_id = sl.level_id
        WHERE s.stud_school_status = 'Active'
        ORDER BY sl.level_id, s.stud_lastname, s.stud_firstname
    ");
    $studentsStmt->execute();
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($students)) {
        echo json_encode([
            "status" => "success",
            "message" => "No active students found",
            "hasData" => false,
            "levelData" => [],
            "levelNames" => [],
            "riskLevelData" => [],
            "totalStudents" => 0
        ]);
        exit();
    }
    
    // Organize students by level
    $levelData = [];
    $levelNames = [];
    $riskLevelData = [];
    
    foreach ($students as $student) {
        $levelName = $student['level_name'];
        
        if (!in_array($levelName, $levelNames)) {
            $levelNames[] = $levelName;
            $levelData[$levelName] = [
                'Male' => 0,
                'Female' => 0,
                'Total' => 0
            ];
                                     $riskLevelData[$levelName] = [
                'Low' => 0,
                'Moderate' => 0,
                'High' => 0,
                'No Data' => 0,
                'Total' => 0
            ];
        }
        
        // Count students by gender
        $gender = $student['stud_gender'];
        $levelData[$levelName][$gender]++;
        $levelData[$levelName]['Total']++;
        
        // Get risk level for this student
        $studentRiskLevel = getStudentRiskLevel($conn, $student['student_id'], $report_type);
        $riskLevelData[$levelName][$studentRiskLevel]++;
        // Only count in total if it's not 'No Data'
        if ($studentRiskLevel !== 'No Data') {
            $riskLevelData[$levelName]['Total']++;
        }
    }
    
    // Calculate total students
    $totalStudents = array_sum(array_column($levelData, 'Total'));
    
         echo json_encode([
         "status" => "success",
         "message" => "",
         "hasData" => $totalStudents > 0,
         "levelData" => $levelData,
         "levelNames" => $levelNames,
         "riskLevelData" => $riskLevelData,
         "totalStudents" => $totalStudents,
         "reportType" => $report_type
     ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_risk_level_report_data.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Database error occurred",
        "error" => $e->getMessage()
    ]);
}

function getStudentRiskLevel($conn, $student_id, $report_type) {
    try {
        if ($report_type === 'progress') {
            // For Progress Report - check progress cards and overall progress
            return getProgressRiskLevel($conn, $student_id);
        } else {
            // For Subject Report - check subject assessments
            return getSubjectRiskLevel($conn, $student_id);
        }
    } catch (Exception $e) {
        error_log("Error getting risk level for student $student_id: " . $e->getMessage());
        return 'Low'; // Default to low risk if error occurs
    }
}

function getProgressRiskLevel($conn, $student_id) {
    // Get all advisories for this student
    $advisoryStmt = $conn->prepare("
        SELECT DISTINCT advisory_id 
        FROM tbl_progress_cards 
        WHERE student_id = ?
    ");
    $advisoryStmt->execute([$student_id]);
    $advisories = $advisoryStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($advisories)) {
        return 'No Data';
    }
    
    foreach ($advisories as $advisory) {
        $advisory_id = $advisory['advisory_id'];
        
        // First check if student has overall progress
        $overallStmt = $conn->prepare("
            SELECT risk_id 
            FROM tbl_overall_progress 
            WHERE student_id = ? AND advisory_id = ? 
            ORDER BY overall_progress_id DESC 
            LIMIT 1
        ");
        $overallStmt->execute([$student_id, $advisory_id]);
        $overallResult = $overallStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($overallResult && $overallResult['risk_id']) {
            // Student has overall progress - use that risk_id
            switch ($overallResult['risk_id']) {
                case 1:
                    return 'Low';
                case 2:
                    return 'Moderate';
                case 3:
                    return 'High';
                default:
                    return 'No Data';
            }
        } else {
            // Student has no overall progress - check latest quarter
            // Check quarters in descending order: Q4, Q3, Q2, Q1
            $quarters = [4, 3, 2, 1];
            
            foreach ($quarters as $quarter) {
                $quarterStmt = $conn->prepare("
                    SELECT risk_id 
                    FROM tbl_progress_cards 
                    WHERE student_id = ? AND advisory_id = ? AND quarter_id = ? AND risk_id IS NOT NULL
                    ORDER BY card_id DESC 
                    LIMIT 1
                ");
                $quarterStmt->execute([$student_id, $advisory_id, $quarter]);
                $quarterResult = $quarterStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($quarterResult && $quarterResult['risk_id']) {
                    // Found risk_id for this quarter
                                switch ($quarterResult['risk_id']) {
                case 1:
                    return 'Low';
                case 2:
                    return 'Moderate';
                case 3:
                    return 'High';
                default:
                    return 'No Data';
            }
                }
            }
        }
    }
    
    // If no risk_id found in any quarter or overall progress
    return 'No Data';
}

function getSubjectRiskLevel($conn, $student_id) {
    // For Subject Report - use the same logic as Progress Report for now
    // This can be updated later when subject assessment structure is implemented
    return getProgressRiskLevel($conn, $student_id);
}
?> 