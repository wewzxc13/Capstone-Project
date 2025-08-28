<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['records']) || !is_array($data['records'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing or invalid records array.']);
    exit();
}

$updated = 0;
$errors = [];

foreach ($data['records'] as $rec) {
    $attendance_id = isset($rec['attendance_id']) ? intval($rec['attendance_id']) : null;
    $attendance_status = isset($rec['attendance_status']) && $rec['attendance_status'] === 'Present' ? 'Present' : 'Absent';
    if (!$attendance_id) {
        $errors[] = [
            'attendance_id' => $attendance_id,
            'error' => 'Missing attendance_id.'
        ];
        continue;
    }
    try {
        $stmt = $conn->prepare("UPDATE tbl_attendance SET attendance_status = ?, recorded_at = NOW() WHERE attendance_id = ?");
        $stmt->execute([$attendance_status, $attendance_id]);
        $updated++;
    } catch (PDOException $e) {
        $errors[] = [
            'attendance_id' => $attendance_id,
            'error' => $e->getMessage()
        ];
    }
}

if ($updated > 0) {
    echo json_encode(['status' => 'success', 'updated' => $updated, 'errors' => $errors]);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No records updated.', 'errors' => $errors]);
} 