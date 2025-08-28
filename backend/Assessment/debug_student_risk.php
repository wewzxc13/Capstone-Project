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
$student_id = isset($input['student_id']) ? intval($input['student_id']) : null;
$advisory_id = isset($input['advisory_id']) ? intval($input['advisory_id']) : null;

if (!$student_id || !$advisory_id) {
    echo json_encode(["status" => "error", "message" => "Student ID and Advisory ID are required"]);
    exit();
}

try {
    // Get student info
    $studentStmt = $conn->prepare("
        SELECT student_id, stud_firstname, stud_lastname, stud_middlename 
        FROM tbl_students 
        WHERE student_id = ?
    ");
    $studentStmt->execute([$student_id]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get advisory info
    $advisoryStmt = $conn->prepare("
        SELECT advisory_id, advisory_name 
        FROM tbl_advisory 
        WHERE advisory_id = ?
    ");
    $advisoryStmt->execute([$advisory_id]);
    $advisory = $advisoryStmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if student has completed all quarters (4 quarters)
    $quartersStmt = $conn->prepare("
        SELECT COUNT(DISTINCT quarter_id) as quarter_count 
        FROM tbl_progress_cards 
        WHERE student_id = ? AND advisory_id = ? AND is_finalized = 1
    ");
    $quartersStmt->execute([$student_id, $advisory_id]);
    $quarterResult = $quartersStmt->fetch(PDO::FETCH_ASSOC);
    $completedQuarters = $quarterResult['quarter_count'] ?? 0;
    
    // Get all progress cards for this student
    $progressStmt = $conn->prepare("
        SELECT card_id, quarter_id, is_finalized, risk_id, created_at
        FROM tbl_progress_cards 
        WHERE student_id = ? AND advisory_id = ?
        ORDER BY quarter_id DESC, card_id DESC
    ");
    $progressStmt->execute([$student_id, $advisory_id]);
    $progressCards = $progressStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check which quarters have risk data (both finalized and non-finalized)
    $quarterBreakdown = [
        "quarter_1_has_risk" => false,
        "quarter_2_has_risk" => false,
        "quarter_3_has_risk" => false,
        "quarter_4_has_risk" => false,
        "quarter_1_finalized" => false,
        "quarter_2_finalized" => false,
        "quarter_3_finalized" => false,
        "quarter_4_finalized" => false
    ];
    
    foreach ($progressCards as $card) {
        if ($card['risk_id']) {
            $quarterBreakdown["quarter_{$card['quarter_id']}_has_risk"] = true;
            if ($card['is_finalized'] == 1) {
                $quarterBreakdown["quarter_{$card['quarter_id']}_finalized"] = true;
            }
        }
    }
    
    // Get all overall progress records for this student
    $overallStmt = $conn->prepare("
        SELECT overall_progress_id, risk_id, created_at
        FROM tbl_overall_progress 
        WHERE student_id = ? AND advisory_id = ?
        ORDER BY overall_progress_id DESC
    ");
    $overallStmt->execute([$student_id, $advisory_id]);
    $overallProgress = $overallStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $risk_id = null;
    $source = null;
    
    if ($completedQuarters >= 4) {
        // Student completed all quarters - check overall progress
        if (!empty($overallProgress)) {
            $latestOverall = $overallProgress[0];
            if ($latestOverall['risk_id']) {
                $risk_id = $latestOverall['risk_id'];
                $source = 'overall_progress';
            }
        }
    } else {
        // Student hasn't completed all quarters - check for the highest available quarter risk
        // Try 4th quarter first, then 3rd, 2nd, 1st in descending order
        // Check both finalized and non-finalized quarters
        $quarters = [4, 3, 2, 1];
        $risk_id = null;
        $source = null;
        
        foreach ($quarters as $quarter) {
            // First try to find finalized quarter
            $cardStmt = $conn->prepare("
                SELECT risk_id, quarter_id, is_finalized
                FROM tbl_progress_cards 
                WHERE student_id = ? AND advisory_id = ? AND quarter_id = ? AND is_finalized = 1
                ORDER BY card_id DESC 
                LIMIT 1
            ");
            $cardStmt->execute([$student_id, $advisory_id, $quarter]);
            $cardResult = $cardStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($cardResult && $cardResult['risk_id']) {
                $risk_id = $cardResult['risk_id'];
                $source = "quarter_{$quarter}_finalized";
                break; // Found the highest available finalized quarter with risk data
            }
            
            // If no finalized quarter found, try non-finalized quarter
            $cardStmt = $conn->prepare("
                SELECT risk_id, quarter_id, is_finalized
                FROM tbl_progress_cards 
                WHERE student_id = ? AND advisory_id = ? AND quarter_id = ? AND is_finalized = 0
                ORDER BY card_id DESC 
                LIMIT 1
            ");
            $cardStmt->execute([$student_id, $advisory_id, $quarter]);
            $cardResult = $cardStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($cardResult && $cardResult['risk_id']) {
                $risk_id = $cardResult['risk_id'];
                $source = "quarter_{$quarter}_not_finalized";
                break; // Found the highest available non-finalized quarter with risk data
            }
        }
    }
    
    // Get risk name
    $riskName = null;
    if ($risk_id) {
        $riskStmt = $conn->prepare("SELECT risk_name FROM tbl_risk_levels WHERE risk_id = ?");
        $riskStmt->execute([$risk_id]);
        $riskResult = $riskStmt->fetch(PDO::FETCH_ASSOC);
        $riskName = $riskResult ? $riskResult['risk_name'] : null;
    }
    
    echo json_encode([
        "status" => "success",
        "student" => $student,
        "advisory" => $advisory,
        "completed_quarters" => $completedQuarters,
        "progress_cards" => $progressCards,
        "overall_progress" => $overallProgress,
        "risk_id" => $risk_id,
        "risk_name" => $riskName,
        "source" => $source,
        "is_high_risk" => ($risk_id == 3),
        "debug_info" => [
            "has_progress_cards" => !empty($progressCards),
            "has_overall_progress" => !empty($overallProgress),
            "all_quarters_completed" => ($completedQuarters >= 4),
            "latest_card_has_risk" => !empty($progressCards) && $progressCards[0]['risk_id'] ? true : false,
            "latest_overall_has_risk" => !empty($overallProgress) && $overallProgress[0]['risk_id'] ? true : false,
            "quarter_breakdown" => $quarterBreakdown
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in debug_student_risk.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Database error occurred",
        "error" => $e->getMessage()
    ]);
}
?> 