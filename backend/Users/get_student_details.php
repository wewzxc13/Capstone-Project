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

if (!$data || !isset($data['student_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Student ID is required']);
    exit;
}

$studentId = intval($data['student_id']);

try {
    $stmt = $conn->prepare("
        SELECT 
            s.student_id,
            s.stud_firstname,
            s.stud_middlename,
            s.stud_lastname,
            s.stud_birthdate,
            s.stud_gender,
            s.stud_handedness,
            s.stud_schedule_class,
            s.stud_photo,
            s.stud_school_status,
            s.level_id,
            s.parent_id,
            s.parent_profile_id,
            s.stud_enrollment_date
        FROM tbl_students s
        WHERE s.student_id = ?
    ");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($student) {
        $fullName = trim($student['stud_firstname'] . ' ' . $student['stud_middlename'] . ' ' . $student['stud_lastname']);
        $fullName = preg_replace('/\s+/', ' ', $fullName);
        $response = [
            'status' => 'success',
            'student' => [
                'id' => $student['student_id'],
                'firstName' => $student['stud_firstname'],
                'middleName' => $student['stud_middlename'],
                'lastName' => $student['stud_lastname'],
                'fullName' => $fullName,
                'user_birthdate' => $student['stud_birthdate'],
                'gender' => $student['stud_gender'],
                'handedness' => $student['stud_handedness'],
                'scheduleClass' => $student['stud_schedule_class'],
                'photo' => $student['stud_photo'] ? 
                    'http://localhost/capstone-project/backend/Uploads/' . $student['stud_photo'] : 
                    ($student['stud_gender'] === 'Male' ? 'http://localhost/capstone-project/backend/Uploads/default_boy_student.jpg' : 'http://localhost/capstone-project/backend/Uploads/default_girl_student.jpg'),
                'stud_photo' => $student['stud_photo'],
                'schoolStatus' => $student['stud_school_status'],
                'levelId' => $student['level_id'],
                'parentId' => $student['parent_id'],
                'parentProfileId' => $student['parent_profile_id'],
                'enrollmentDate' => $student['stud_enrollment_date'],
                'role' => 'Student',
            ]
        ];
        echo json_encode($response);
        exit;
    }

    http_response_code(404);
    echo json_encode(['message' => 'Student not found']);
    exit;

} catch (PDOException $e) {
    $errorMessage = date('Y-m-d H:i:s') . " - Database error in get_student_details.php: " . $e->getMessage() . "\n";
    file_put_contents('../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?> 