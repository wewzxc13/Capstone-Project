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
    // Check if student has progress data for all quarters (4 quarters)
    $quartersStmt = $conn->prepare("
        SELECT COUNT(DISTINCT quarter_id) as quarter_count 
        FROM tbl_progress_cards 
        WHERE student_id = ? AND advisory_id = ?
    ");
    $quartersStmt->execute([$student_id, $advisory_id]);
    $quarterResult = $quartersStmt->fetch(PDO::FETCH_ASSOC);
    $totalQuarters = $quarterResult['quarter_count'] ?? 0;
    
    // Check if student has finalized all quarters
    $finalizedQuartersStmt = $conn->prepare("
        SELECT COUNT(DISTINCT quarter_id) as quarter_count 
        FROM tbl_progress_cards 
        WHERE student_id = ? AND advisory_id = ? AND is_finalized = 1
    ");
    $finalizedQuartersStmt->execute([$student_id, $advisory_id]);
    $finalizedQuarterResult = $finalizedQuartersStmt->fetch(PDO::FETCH_ASSOC);
    $completedQuarters = $finalizedQuarterResult['quarter_count'] ?? 0;
    
    $risk_id = null;
    $source = null;
    
    if ($completedQuarters >= 4) {
        // Student has finalized all quarters - check overall progress first
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
            $risk_id = $overallResult['risk_id'];
            $source = 'overall_progress';
        } else {
            // No overall progress found, fall back to highest quarter risk
            $quarters = [4, 3, 2, 1];
            foreach ($quarters as $quarter) {
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
                    break;
                }
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
        "risk_id" => $risk_id,
        "risk_name" => $riskName,
        "source" => $source,
        "total_quarters" => $totalQuarters,
        "completed_quarters" => $completedQuarters,
        "is_high_risk" => ($risk_id == 3)
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get_student_risk_status.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Database error occurred",
        "error" => $e->getMessage()
    ]);
}
?> 