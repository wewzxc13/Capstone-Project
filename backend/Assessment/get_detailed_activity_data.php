<?php
// Ensure clean JSON output (no HTML errors)
ini_set('display_errors', 0);
ini_set('html_errors', 0);
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    if (ob_get_length()) { ob_end_clean(); }
    exit;
}

// Convert PHP warnings/notices to exceptions so we can return JSON instead of HTTP 500 HTML
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

require_once '../connection.php';

try {
    $response = [
        'success' => true,
        'data' => [],
        'message' => 'Detailed activity data retrieved successfully'
    ];

    // Utility: check table existence safely (PDO)
    $tableExists = function(PDO $conn, string $tableName): bool {
        try {
            $stmt = $conn->prepare("SHOW TABLES LIKE :t");
            $stmt->execute([':t' => $tableName]);
            return $stmt->rowCount() > 0;
        } catch (Throwable $e) {
            return false;
        }
    };

    // Get comprehensive activity data with joins (only if required tables exist)
    $requiredForActivities = [
        'tbl_activities', 'tbl_subjects', 'tbl_quarters', 'tbl_advisory', 'tbl_student_levels'
    ];
    $canQueryActivities = true;
    foreach ($requiredForActivities as $t) {
        if (!$tableExists($conn, $t)) { $canQueryActivities = false; break; }
    }

    if ($canQueryActivities) {
        $detailedQuery = "
            SELECT 
                a.activity_id,
                a.activity_name,
                a.activity_date,
                a.activity_status,
                a.activity_num,
                s.subject_name,
                q.quarter_name,
                q.start_date as quarter_start,
                q.end_date as quarter_end,
                adv.advisory_id,
                adv.level_id,
                sl.level_name as advisory_name,
                adv.lead_teacher_id,
                adv.assistant_teacher_id,
                adv.total_male,
                adv.total_female,
                adv.total_students,
                CONCAT(sl.level_name, ' - Advisory ', adv.advisory_id) as advisory_display_name
            FROM tbl_activities a
            LEFT JOIN tbl_subjects s ON a.subject_id = s.subject_id
            LEFT JOIN tbl_quarters q ON a.quarter_id = q.quarter_id
            LEFT JOIN tbl_advisory adv ON a.advisory_id = adv.advisory_id
            LEFT JOIN tbl_student_levels sl ON adv.level_id = sl.level_id
            ORDER BY a.activity_date DESC, a.activity_id DESC
            LIMIT 100
        ";

        $result = $conn->query($detailedQuery);
        $activities = $result->fetchAll(PDO::FETCH_ASSOC);
        $response['data']['activities'] = $activities;
        $response['data']['total_activities'] = count($activities);
    } else {
        $response['data']['activities'] = [];
        $response['data']['total_activities'] = 0;
        $response['data']['activities_note'] = 'One or more required tables are missing';
    }

    // Get subjects summary
    $subjects = [];
    if ($tableExists($conn, 'tbl_subjects')) {
        $subjectsResult = $conn->query("SELECT * FROM tbl_subjects ORDER BY subject_name");
        $subjects = $subjectsResult->fetchAll(PDO::FETCH_ASSOC);
    }
    $response['data']['subjects'] = $subjects;

    // Get quarters summary
    $quarters = [];
    if ($tableExists($conn, 'tbl_quarters')) {
        $quartersResult = $conn->query("SELECT * FROM tbl_quarters ORDER BY quarter_id");
        $quarters = $quartersResult->fetchAll(PDO::FETCH_ASSOC);
    }
    $response['data']['quarters'] = $quarters;

    // Get advisory classes summary (join level name)
    $advisory = [];
    if ($tableExists($conn, 'tbl_advisory')) {
        $advisoryQuery = "
            SELECT adv.*, sl.level_name
            FROM tbl_advisory adv
            LEFT JOIN tbl_student_levels sl ON adv.level_id = sl.level_id
            ORDER BY adv.level_id, adv.advisory_id
        ";
        if ($tableExists($conn, 'tbl_student_levels')) {
            $advisoryResult = $conn->query($advisoryQuery);
            $advisory = $advisoryResult->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $advisoryResult = $conn->query("SELECT * FROM tbl_advisory ORDER BY advisory_id");
            $advisory = $advisoryResult->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    $response['data']['advisory'] = $advisory;

    // Get visual feedback (visual scoring)
    $visual = [];
    if ($tableExists($conn, 'tbl_visual_feedback')) {
        $visualResult = $conn->query("SELECT * FROM tbl_visual_feedback ORDER BY min_score DESC");
        $visual = $visualResult->fetchAll(PDO::FETCH_ASSOC);
    }
    $response['data']['visual_feedback'] = $visual;

    // Get activity statistics
    $statsQuery = "
        SELECT 
            COUNT(*) as total_activities,
            COUNT(CASE WHEN activity_status = 'Active' THEN 1 END) as active_activities,
            COUNT(CASE WHEN activity_status = 'Archived' THEN 1 END) as archived_activities,
            COUNT(DISTINCT subject_id) as unique_subjects,
            COUNT(DISTINCT advisory_id) as unique_advisory_classes,
            COUNT(DISTINCT quarter_id) as unique_quarters
        FROM tbl_activities
    ";
    
    if ($tableExists($conn, 'tbl_activities')) {
        $statsResult = $conn->query($statsQuery);
        $response['data']['statistics'] = $statsResult->fetch(PDO::FETCH_ASSOC);
    } else {
        $response['data']['statistics'] = [
            'total_activities' => 0,
            'active_activities' => 0,
            'archived_activities' => 0,
            'unique_subjects' => 0,
            'unique_advisory_classes' => 0,
            'unique_quarters' => 0
        ];
    }

    // Get recent activities (last 30 days)
    $recentQuery = "
        SELECT 
            a.activity_name,
            a.activity_date,
            s.subject_name,
            a.activity_status
        FROM tbl_activities a
        LEFT JOIN tbl_subjects s ON a.subject_id = s.subject_id
        WHERE a.activity_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY a.activity_date DESC
        LIMIT 20
    ";
    
    $recentActivities = [];
    if ($tableExists($conn, 'tbl_activities')) {
        $recentResult = $conn->query($recentQuery);
        $recentActivities = $recentResult->fetchAll(PDO::FETCH_ASSOC);
    }
    $response['data']['recent_activities'] = $recentActivities;

    $response['summary'] = [
        'total_tables_queried' => 4,
        'generated_at' => date('Y-m-d H:i:s'),
        'data_sources' => [
            'tbl_activities',
            'tbl_subjects', 
            'tbl_quarters',
            'tbl_advisory'
        ]
    ];

    // Clear any accidental output from included files
    if (ob_get_length()) { ob_clean(); }
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    if (ob_get_length()) { ob_clean(); }
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving detailed activity data: ' . $e->getMessage(),
        'data' => []
    ]);
}

// Close PDO connection
$conn = null;
// End buffering
if (ob_get_length()) { ob_end_flush(); }
?>
