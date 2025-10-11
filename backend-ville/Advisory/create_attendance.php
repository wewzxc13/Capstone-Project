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

$inserted = 0;
$errors = [];

foreach ($data['records'] as $rec) {
    $student_id = isset($rec['student_id']) ? intval($rec['student_id']) : null;
    $recorded_by = isset($rec['recorded_by']) ? intval($rec['recorded_by']) : null;
    $attendance_date = isset($rec['attendance_date']) ? $rec['attendance_date'] : null;
    $attendance_status = isset($rec['attendance_status']) && $rec['attendance_status'] === 'Present' ? 'Present' : 'Absent';

    if (!$student_id || !$recorded_by || !$attendance_date) {
        $errors[] = [
            'student_id' => $student_id,
            'error' => 'Missing required fields.'
        ];
        continue;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO tbl_attendance (student_id, recorded_by, attendance_date, attendance_status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$student_id, $recorded_by, $attendance_date, $attendance_status]);
        $inserted++;
    } catch (PDOException $e) {
        $errors[] = [
            'student_id' => $student_id,
            'error' => $e->getMessage()
        ];
    }
}

if ($inserted > 0) {
    echo json_encode(['status' => 'success', 'inserted' => $inserted, 'errors' => $errors]);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No records inserted.', 'errors' => $errors]);
} 