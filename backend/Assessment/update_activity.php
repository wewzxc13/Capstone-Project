<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

$input = json_decode(file_get_contents('php://input'), true);
$activity_id = isset($input['activity_id']) ? intval($input['activity_id']) : null;
$activity_name = isset($input['activity_name']) ? trim($input['activity_name']) : null;
$activity_date = isset($input['activity_date']) ? $input['activity_date'] : null;

if (!$activity_id || !$activity_name || !$activity_date) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
    exit();
}

try {
    // Get current quarter_id, advisory_id, subject_id
    $stmt = $conn->prepare('SELECT quarter_id, advisory_id, subject_id FROM tbl_activities WHERE activity_id = ?');
    $stmt->execute([$activity_id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    $old_quarter_id = $current ? $current['quarter_id'] : null;
    $advisory_id = $current ? $current['advisory_id'] : null;
    $subject_id = $current ? $current['subject_id'] : null;

    // Debug: Log the activity_date and the quarter lookup
    error_log('DEBUG: activity_date=' . $activity_date);
    $quarter_sql = 'SELECT quarter_id FROM tbl_quarters WHERE start_date <= ? AND end_date >= ? LIMIT 1';
    error_log('DEBUG: quarter SQL=' . $quarter_sql);
    $stmt = $conn->prepare($quarter_sql);
    $stmt->execute([$activity_date, $activity_date]);
    $quarter = $stmt->fetch(PDO::FETCH_ASSOC);
    error_log('DEBUG: quarter result=' . print_r($quarter, true));
    $quarter_id = $quarter ? $quarter['quarter_id'] : null;

    if ($quarter_id) {
        // If quarter_id changed, update activity_num
        if ($quarter_id != $old_quarter_id && $advisory_id && $subject_id) {
            $stmt = $conn->prepare('SELECT COALESCE(MAX(activity_num), 0) + 1 AS next_activity_num FROM tbl_activities WHERE advisory_id = ? AND subject_id = ? AND quarter_id = ?');
            $stmt->execute([$advisory_id, $subject_id, $quarter_id]);
            $next_activity_num = $stmt->fetchColumn();
            $stmt = $conn->prepare('UPDATE tbl_activities SET activity_name = ?, activity_date = ?, quarter_id = ?, activity_num = ? WHERE activity_id = ?');
            $stmt->execute([$activity_name, $activity_date, $quarter_id, $next_activity_num, $activity_id]);
        } else {
            $stmt = $conn->prepare('UPDATE tbl_activities SET activity_name = ?, activity_date = ?, quarter_id = ? WHERE activity_id = ?');
            $stmt->execute([$activity_name, $activity_date, $quarter_id, $activity_id]);
        }
    } else {
        $stmt = $conn->prepare('UPDATE tbl_activities SET activity_name = ?, activity_date = ? WHERE activity_id = ?');
        $stmt->execute([$activity_name, $activity_date, $activity_id]);
    }
    echo json_encode(['status' => 'success', 'message' => 'Activity updated successfully.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 