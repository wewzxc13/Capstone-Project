<?php
// Dynamic CORS for localhost:3000+
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // fallback
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST requests are allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['advisory_id'], $data['level_id'], $data['students'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}
$advisory_id = intval($data['advisory_id']);
$level_id = intval($data['level_id']);
$students = $data['students'];

try {
    // Update advisory class
    $stmt = $conn->prepare('UPDATE tbl_advisory SET level_id = ? WHERE advisory_id = ?');
    $stmt->execute([$level_id, $advisory_id]);

    // Remove all current student assignments for this advisory
    $stmt = $conn->prepare('DELETE FROM tbl_student_assigned WHERE advisory_id = ?');
    $stmt->execute([$advisory_id]);

    // Insert new student assignments
    $male = 0;
    $female = 0;
    foreach ($students as $stud) {
        $stmt = $conn->prepare('INSERT INTO tbl_student_assigned (advisory_id, student_id) VALUES (?, ?)');
        $stmt->execute([$advisory_id, $stud['student_id']]);
        if (strtolower($stud['gender']) === 'male') $male++;
        if (strtolower($stud['gender']) === 'female') $female++;
        // Optionally update schedule_class in tbl_students
        if (isset($stud['schedule_class'])) {
            $stmt2 = $conn->prepare('UPDATE tbl_students SET stud_schedule_class = ? WHERE student_id = ?');
            $stmt2->execute([$stud['schedule_class'], $stud['student_id']]);
        }
    }
    // Update gender counts
    $stmt = $conn->prepare('UPDATE tbl_advisory SET total_male = ?, total_female = ? WHERE advisory_id = ?');
    $stmt->execute([$male, $female, $advisory_id]);

    echo json_encode(['status' => 'success']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 