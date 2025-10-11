<?php
// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Get parent_id from query parameters
$parentId = isset($_GET['parent_id']) ? intval($_GET['parent_id']) : 0;

if ($parentId <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Valid parent_id is required']);
    exit;
}

try {
    // Check database connection
    if (!$conn) {
        throw new Exception('Database connection failed. Please check your database configuration.');
    }
    
    // Get all students for this parent
    $stmt = $conn->prepare("
        SELECT 
            s.student_id,
            s.stud_firstname,
            s.stud_lastname,
            s.stud_middlename
        FROM tbl_students s
        WHERE s.parent_id = ? AND s.stud_school_status = 'Active'
        ORDER BY s.stud_firstname, s.stud_lastname
    ");
    
    $stmt->execute([$parentId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($students)) {
        echo json_encode([
            'status' => 'success',
            'data' => [
                'children_at_risk_count' => 0,
                'children_details' => []
            ]
        ]);
        exit;
    }
    
    $childrenAtRiskCount = 0;
    $childrenDetails = [];
    
    foreach ($students as $student) {
        $studentId = $student['student_id'];
        $studentName = trim($student['stud_firstname'] . ' ' . 
                           ($student['stud_middlename'] ? $student['stud_middlename'] . ' ' : '') . 
                           $student['stud_lastname']);
        
        // First, check if there's a final risk in tbl_overall_progress
        $stmt = $conn->prepare("
            SELECT 
                op.risk_id,
                op.computed_at,
                r.risk_name
            FROM tbl_overall_progress op
            LEFT JOIN tbl_risk_levels r ON op.risk_id = r.risk_id
            WHERE op.student_id = ?
            ORDER BY op.computed_at DESC
            LIMIT 1
        ");
        
        $stmt->execute([$studentId]);
        $finalRisk = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $riskStatus = 'No Risk';
        $riskSource = 'None';
        $riskId = null;
        $riskName = null;
        
        if ($finalRisk && $finalRisk['risk_id']) {
            // Final risk exists
            $riskId = $finalRisk['risk_id'];
            $riskName = $finalRisk['risk_name'] ?: 'Unknown';
            $riskSource = 'Final Risk';
            
            if ($finalRisk['risk_id'] == 3) { // High risk
                $riskStatus = 'High Risk';
                $childrenAtRiskCount++;
            } elseif ($finalRisk['risk_id'] == 2) {
                $riskStatus = 'Moderate Risk';
            } elseif ($finalRisk['risk_id'] == 1) {
                $riskStatus = 'Low Risk';
            }
        } else {
            // No final risk, check latest progress quarter risk
            // Check in order: 4th quarter, 3rd quarter, 2nd quarter, 1st quarter
            $quarters = [4, 3, 2, 1];
            $latestQuarterRisk = null;
            
            foreach ($quarters as $quarterId) {
                $stmt = $conn->prepare("
                    SELECT 
                        pc.risk_id,
                        pc.report_date,
                        r.risk_name,
                        q.quarter_name
                    FROM tbl_progress_cards pc
                    LEFT JOIN tbl_risk_levels r ON pc.risk_id = r.risk_id
                    LEFT JOIN tbl_quarters q ON pc.quarter_id = q.quarter_id
                    WHERE pc.student_id = ? AND pc.quarter_id = ?
                    ORDER BY pc.report_date DESC
                    LIMIT 1
                ");
                
                $stmt->execute([$studentId, $quarterId]);
                $quarterRisk = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($quarterRisk && $quarterRisk['risk_id']) {
                    $latestQuarterRisk = $quarterRisk;
                    break; // Found the latest quarter with risk data
                }
            }
            
            if ($latestQuarterRisk) {
                $riskId = $latestQuarterRisk['risk_id'];
                $riskName = $latestQuarterRisk['risk_name'] ?: 'Unknown';
                $riskSource = 'Latest Quarter (' . $latestQuarterRisk['quarter_name'] . ')';
                
                if ($latestQuarterRisk['risk_id'] == 3) { // High risk
                    $riskStatus = 'High Risk';
                    $childrenAtRiskCount++;
                } elseif ($latestQuarterRisk['risk_id'] == 2) {
                    $riskStatus = 'Moderate Risk';
                } elseif ($latestQuarterRisk['risk_id'] == 1) {
                    $riskStatus = 'Low Risk';
                }
            }
        }
        
        $childrenDetails[] = [
            'student_id' => $studentId,
            'student_name' => $studentName,
            'risk_status' => $riskStatus,
            'risk_source' => $riskSource,
            'risk_id' => $riskId,
            'risk_name' => $riskName
        ];
    }
    
    // Prepare response
    $response = [
        'status' => 'success',
        'data' => [
            'children_at_risk_count' => $childrenAtRiskCount,
            'children_details' => $childrenDetails
        ]
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    error_log("Parent Children Risk API PDO Error: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error occurred',
        'error' => $e->getMessage(),
        'sql_state' => $e->getCode()
    ]);
} catch (Exception $e) {
    error_log("Parent Children Risk API General Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'An error occurred',
        'error' => $e->getMessage()
    ]);
}
?>
