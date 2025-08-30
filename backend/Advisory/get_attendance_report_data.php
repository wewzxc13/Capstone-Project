<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    include_once __DIR__ . '/../connection.php';
    
    // Get student counts by level and gender (only students linked to parents)
    $query = "
        SELECT 
            sl.level_name,
            s.stud_gender,
            COUNT(*) as count
        FROM tbl_students s
        JOIN tbl_student_levels sl ON s.level_id = sl.level_id
        WHERE s.stud_school_status = 'Active' AND s.parent_id IS NOT NULL
        GROUP BY sl.level_name, s.stud_gender
        ORDER BY sl.level_id, s.stud_gender
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Organize data by level and gender
    $levelData = [];
    $levelNames = [];
    
    foreach ($results as $row) {
        $levelName = $row['level_name'];
        $gender = $row['stud_gender'];
        $count = intval($row['count']);
        
        if (!isset($levelData[$levelName])) {
            $levelData[$levelName] = [
                'Male' => 0,
                'Female' => 0,
                'Total' => 0
            ];
            $levelNames[] = $levelName;
        }
        
        $levelData[$levelName][$gender] = $count;
        $levelData[$levelName]['Total'] += $count;
    }

    // Check if we have any student data
    if (empty($levelNames)) {
        echo json_encode([
            'status' => 'success',
            'message' => 'No active students linked to parents found in the system yet.',
            'levelData' => [],
            'levelNames' => [],
            'quarterData' => [],
            'hasData' => false
        ]);
        exit();
    }

    // Get attendance data by quarter using actual quarter date ranges from tbl_quarters
    // Include all quarters that have attendance data (not just current calendar year)
    // Only count students linked to parents
    $attendanceQuery = "
        SELECT 
            sl.level_name,
            q.quarter_id,
            q.quarter_name,
            COUNT(CASE WHEN a.attendance_status = 'Present' THEN 1 END) as present_count,
            COUNT(*) as total_count
        FROM tbl_attendance a
        JOIN tbl_students s ON a.student_id = s.student_id
        JOIN tbl_student_levels sl ON s.level_id = sl.level_id
        JOIN tbl_quarters q ON a.attendance_date BETWEEN q.start_date AND q.end_date
        WHERE s.parent_id IS NOT NULL
        GROUP BY sl.level_name, q.quarter_id, q.quarter_name
        ORDER BY sl.level_id, q.quarter_id
    ";
    
    $stmt = $conn->prepare($attendanceQuery);
    $stmt->execute();
    $attendanceResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get quarter names from database
    $quarterQuery = "SELECT quarter_id, quarter_name FROM tbl_quarters ORDER BY quarter_id";
    $stmt = $conn->prepare($quarterQuery);
    $stmt->execute();
    $quarters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $quarterNames = [];
    foreach ($quarters as $quarter) {
        $quarterNames[] = $quarter['quarter_name'];
    }
    
    // Initialize quarter data with default values
    $quarterData = [];
    foreach ($levelNames as $levelName) {
        $quarterData[$levelName] = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4
    }

    // Process attendance data and calculate percentages
    foreach ($attendanceResults as $row) {
        $levelName = $row['level_name'];
        $quarterId = intval($row['quarter_id']);
        $presentCount = intval($row['present_count']);
        $totalCount = intval($row['total_count']);
        
        // Calculate attendance percentage
        $attendanceRate = $totalCount > 0 ? ($presentCount / $totalCount) * 100 : 0;
        
        // Use quarter_id (1-4) and convert to array index (0-3)
        $quarterIndex = $quarterId - 1;
        
        if (isset($quarterData[$levelName])) {
            // If we already have data for this quarter, average it
            if ($quarterData[$levelName][$quarterIndex] > 0) {
                $quarterData[$levelName][$quarterIndex] = round(($quarterData[$levelName][$quarterIndex] + $attendanceRate) / 2, 1);
            } else {
                $quarterData[$levelName][$quarterIndex] = round($attendanceRate, 1);
            }
        }
    }

    // Check if we have any attendance data
    $hasAttendanceData = false;
    foreach ($quarterData as $quarterLevelData) {
        foreach ($quarterLevelData as $quarterValue) {
            if ($quarterValue > 0) {
                $hasAttendanceData = true;
                break 2;
            }
        }
    }

    // Prepare response message
    $message = '';
    if (!$hasAttendanceData) {
        $message = 'No attendance records found for the current year. Attendance data will appear once teachers start recording attendance for students linked to parents.';
    }

    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'levelData' => $levelData,
        'levelNames' => $levelNames,
        'quarterData' => $quarterData,
        'quarterNames' => $quarterNames,
        'hasData' => $hasAttendanceData,
        'totalStudents' => array_sum(array_column($levelData, 'Total'))
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error occurred while fetching attendance data.', 
        'error' => $e->getMessage(),
        'hasData' => false
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'General error occurred: ' . $e->getMessage(),
        'hasData' => false
    ]);
}
?> 