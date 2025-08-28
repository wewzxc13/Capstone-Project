<?php
include_once '../connection.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
                'labels' => ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"],
                'datasets' => []
            ]
        ]);
        exit;
    }
    
    $labels = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];
    $datasets = [];
    $colors = ["#5C9EFF", "#FDCB44", "#FF7B7B", "#34D399", "#A78BFA", "#FB923C"];
    
    foreach ($students as $index => $student) {
        $studentId = $student['student_id'];
        $studentName = trim($student['stud_firstname'] . ' ' . 
                           ($student['stud_middlename'] ? $student['stud_middlename'] . ' ' : '') . 
                           $student['stud_lastname']);
        
        // Get quarterly performance data for this student
        $stmt = $conn->prepare("
            SELECT 
                pc.quarter_id,
                pc.quarter_visual_feedback_id,
                vf.visual_feedback_description
            FROM tbl_progress_cards pc
            LEFT JOIN tbl_visual_feedback vf ON pc.quarter_visual_feedback_id = vf.visual_feedback_id
            WHERE pc.student_id = ?
            ORDER BY pc.quarter_id ASC
        ");
        
        $stmt->execute([$studentId]);
        $quarterlyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Map visual feedback descriptions to performance levels (1-5 scale)
        $performanceData = [null, null, null, null]; // Initialize with null for 4 quarters
        
        foreach ($quarterlyData as $quarter) {
            $quarterIndex = $quarter['quarter_id'] - 1; // Convert to 0-based index
            if ($quarterIndex >= 0 && $quarterIndex < 4) {
                $description = $quarter['visual_feedback_description'];
                
                // Map descriptions to performance levels
                if ($description === 'Not Met') {
                    $performanceData[$quarterIndex] = 1;
                } elseif ($description === 'Need Help') {
                    $performanceData[$quarterIndex] = 2;
                } elseif ($description === 'Good') {
                    $performanceData[$quarterIndex] = 3;
                } elseif ($description === 'Very Good') {
                    $performanceData[$quarterIndex] = 4;
                } elseif ($description === 'Excellent') {
                    $performanceData[$quarterIndex] = 5;
                }
            }
        }
        
        // Create dataset for this student
        $datasets[] = [
            'label' => $studentName,
            'data' => $performanceData,
            'borderColor' => $colors[$index % count($colors)],
            'backgroundColor' => $colors[$index % count($colors)] . "20",
            'fill' => true,
            'tension' => 0.4,
            'borderWidth' => 2,
            'pointRadius' => 5,
            'pointHoverRadius' => 7,
            'pointBorderWidth' => 2,
            'pointBorderColor' => $colors[$index % count($colors)],
            'pointBackgroundColor' => $colors[$index % count($colors)],
            'spanGaps' => true,
        ];
    }
    
    // Prepare response
    $response = [
        'status' => 'success',
        'data' => [
            'labels' => $labels,
            'datasets' => $datasets
        ]
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    error_log("Parent Children Progress API PDO Error: " . $e->getMessage());
    error_log("SQL State: " . $e->getCode());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error occurred',
        'error' => $e->getMessage(),
        'sql_state' => $e->getCode()
    ]);
} catch (Exception $e) {
    error_log("Parent Children Progress API General Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'An error occurred',
        'error' => $e->getMessage()
    ]);
}
?>
