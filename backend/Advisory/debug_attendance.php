<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

// Test with student_id = 3
$student_id = 3;

try {
    // First, get the student's advisory_id
    $stmt = $conn->prepare("SELECT sa.advisory_id, s.stud_firstname, s.stud_lastname, s.stud_middlename 
                           FROM tbl_student_assigned sa 
                           JOIN tbl_students s ON sa.student_id = s.student_id 
                           WHERE sa.student_id = ?");
    $stmt->execute([$student_id]);
    $studentInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$studentInfo) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Student not found or not assigned to any advisory'
        ]);
        exit();
    }
    
    $advisory_id = $studentInfo['advisory_id'];
    $studentName = $studentInfo['stud_firstname'] . ' ' . $studentInfo['stud_middlename'] . ' ' . $studentInfo['stud_lastname'];
    
    // Get all attendance records for this student
    $stmt = $conn->prepare("SELECT * FROM tbl_attendance WHERE student_id = ? ORDER BY attendance_date ASC");
    $stmt->execute([$student_id]);
    $allAttendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by month
    $monthlyData = [];
    $months = [
        7 => 'Aug', 8 => 'Sep', 9 => 'Oct', 10 => 'Nov', 11 => 'Dec',
        0 => 'Jan', 1 => 'Feb', 2 => 'Mar', 3 => 'Apr'
    ];
    
    foreach ($months as $monthNum => $monthName) {
        $monthAttendance = array_filter($allAttendance, function($record) use ($monthNum) {
            return date('n', strtotime($record['attendance_date'])) == ($monthNum + 1);
        });
        
        $monthlyData[$monthName] = [
            'total' => count($monthAttendance),
            'present' => count(array_filter($monthAttendance, function($record) {
                return $record['attendance_status'] === 'Present';
            })),
            'absent' => count(array_filter($monthAttendance, function($record) {
                return $record['attendance_status'] === 'Absent';
            })),
            'dates' => array_map(function($record) {
                return [
                    'date' => $record['attendance_date'],
                    'status' => $record['attendance_status']
                ];
            }, $monthAttendance)
        ];
    }
    
    // Calculate totals
    $totalSchoolDays = array_sum(array_column($monthlyData, 'total'));
    $totalPresent = array_sum(array_column($monthlyData, 'present'));
    $totalAbsent = array_sum(array_column($monthlyData, 'absent'));
    
    echo json_encode([
        'status' => 'success',
        'student_info' => [
            'student_id' => $student_id,
            'name' => $studentName,
            'advisory_id' => $advisory_id
        ],
        'all_attendance_records' => $allAttendance,
        'monthly_breakdown' => $monthlyData,
        'totals' => [
            'total_school_days' => $totalSchoolDays,
            'total_present' => $totalPresent,
            'total_absent' => $totalAbsent
        ],
        'debug_info' => [
            'total_records_found' => count($allAttendance),
            'unique_dates' => count(array_unique(array_column($allAttendance, 'attendance_date')))
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
}
?> 