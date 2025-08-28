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
include_once 'tracking_helper.php';

$input = json_decode(file_get_contents('php://input'), true);
$student_id = isset($input['student_id']) ? intval($input['student_id']) : null;
$activity_id = isset($input['activity_id']) ? intval($input['activity_id']) : null;
$visual_feedback_id = isset($input['visual_feedback_id']) ? intval($input['visual_feedback_id']) : null;

if (!$student_id || !$activity_id || !$visual_feedback_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
    exit();
}

try {
    // Check if tracking record exists for this student/activity
    if (trackingRecordExists($conn, $student_id, $activity_id)) {
        // Update existing record
        if (updateTrackingRecord($conn, $student_id, $activity_id, $visual_feedback_id)) {
            echo json_encode(['status' => 'success', 'message' => 'Rating updated successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update rating.']);
        }
    } else {
        // Insert new record
        if (insertTrackingRecord($conn, $student_id, $activity_id, $visual_feedback_id)) {
            echo json_encode(['status' => 'success', 'message' => 'Rating saved successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to save rating.']);
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 