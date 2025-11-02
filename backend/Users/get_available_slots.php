<?php
// Set error reporting to avoid HTML errors in JSON response
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Include CORS configuration
include_once 'cors_config.php';

include_once '../connection.php';

// Set Content-Type header to ensure JSON response
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only GET requests are allowed']);
    exit;
}

try {
    // Get level_id from query parameter
    $levelId = isset($_GET['level_id']) ? intval($_GET['level_id']) : null;
    
    // If level_id is provided, get slots for that specific level
    // Otherwise, get slots for all levels
    if ($levelId) {
        // Get enrolled count per session for this level
        $stmt = $conn->prepare('
            SELECT 
                stud_schedule_class,
                COUNT(*) as enrolled_count
            FROM tbl_students
            WHERE level_id = ? 
            AND stud_school_status = "Active"
            AND stud_schedule_class IN ("Morning", "Afternoon")
            GROUP BY stud_schedule_class
        ');
        $stmt->execute([$levelId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Initialize slots data for this level (no capacity limit)
        $slots = [
            'Morning' => ['enrolled' => 0],
            'Afternoon' => ['enrolled' => 0]
        ];
        
        // Update enrolled counts from database
        foreach ($results as $row) {
            $session = $row['stud_schedule_class'];
            $enrolled = intval($row['enrolled_count']);
            if (isset($slots[$session])) {
                $slots[$session]['enrolled'] = $enrolled;
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'level_id' => $levelId,
            'slots' => $slots
        ]);
    } else {
        // Get slots for all levels
        $stmt = $conn->prepare('
            SELECT 
                level_id,
                stud_schedule_class,
                COUNT(*) as enrolled_count
            FROM tbl_students
            WHERE stud_school_status = "Active"
            AND stud_schedule_class IN ("Morning", "Afternoon")
            GROUP BY level_id, stud_schedule_class
            ORDER BY level_id, stud_schedule_class
        ');
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Initialize slots for all levels (no capacity limit)
        $allSlots = [];
        for ($i = 1; $i <= 3; $i++) {
            $allSlots[$i] = [
                'Morning' => ['enrolled' => 0],
                'Afternoon' => ['enrolled' => 0]
            ];
        }
        
        // Update enrolled counts from database
        foreach ($results as $row) {
            $levelIdFromDb = intval($row['level_id']);
            $session = $row['stud_schedule_class'];
            $enrolled = intval($row['enrolled_count']);
            if (isset($allSlots[$levelIdFromDb][$session])) {
                $allSlots[$levelIdFromDb][$session]['enrolled'] = $enrolled;
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'slots' => $allSlots
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}

