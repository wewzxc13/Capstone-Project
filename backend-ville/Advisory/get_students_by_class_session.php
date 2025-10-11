<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../connection.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validate required parameters
if (!$data || !isset($data['level_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'level_id is required']);
    exit;
}

$level_id = $data['level_id'];
$session = isset($data['session']) ? $data['session'] : null;

try {
    // Get advisory for this level
    $stmt = $conn->prepare("
        SELECT a.* FROM tbl_advisory a
        WHERE a.level_id = ?
        LIMIT 1
    ");
    $stmt->execute([$level_id]);
    $advisory = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$advisory) {
        echo json_encode([
            'status' => 'success',
            'advisory' => null,
            'students' => [],
            'teachers' => []
        ]);
        exit;
    }

    $advisory_id = $advisory['advisory_id'];

    // Build query for students with parent information
    $studentQuery = "
        SELECT s.*, sa.assigned_id, sa.advisory_id,
               p.user_firstname as parent_firstname, 
               p.user_middlename as parent_middlename, 
               p.user_lastname as parent_lastname
        FROM tbl_student_assigned sa
        JOIN tbl_students s ON sa.student_id = s.student_id
        LEFT JOIN tbl_users p ON s.parent_id = p.user_id
        WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active'
    ";
    $studentParams = [$advisory_id];

    // Add session filter if provided
    if ($session && $session !== 'All') {
        $studentQuery .= " AND s.stud_schedule_class = ?";
        $studentParams[] = $session;
    }

    $studentQuery .= " ORDER BY s.stud_schedule_class, s.stud_lastname, s.stud_firstname";

    $stmt = $conn->prepare($studentQuery);
    $stmt->execute($studentParams);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get teacher information
    $teachers = [];
    
    // Lead teacher
    if (!empty($advisory['lead_teacher_id'])) {
        $stmt = $conn->prepare("SELECT user_id, user_firstname, user_middlename, user_lastname FROM tbl_users WHERE user_id = ?");
        $stmt->execute([$advisory['lead_teacher_id']]);
        $lead = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($lead) {
            $teachers['lead'] = [
                'id' => $lead['user_id'],
                'name' => trim($lead['user_lastname'] . ', ' . $lead['user_firstname'] . ' ' . $lead['user_middlename']),
                'type' => 'Lead Teacher'
            ];
        }
    }
    
    // Assistant teacher
    if (!empty($advisory['assistant_teacher_id'])) {
        $stmt = $conn->prepare("SELECT user_id, user_firstname, user_middlename, user_lastname FROM tbl_users WHERE user_id = ?");
        $stmt->execute([$advisory['assistant_teacher_id']]);
        $assistant = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($assistant) {
            $teachers['assistant'] = [
                'id' => $assistant['user_id'],
                'name' => trim($assistant['user_lastname'] . ', ' . $assistant['user_firstname'] . ' ' . $assistant['user_middlename']),
                'type' => 'Assistant Teacher'
            ];
        }
    }

    // Calculate statistics
    $total_students = count($students);
    $total_male = 0;
    $total_female = 0;
    
    foreach ($students as $student) {
        if ($student['stud_gender'] === 'Male') {
            $total_male++;
        } elseif ($student['stud_gender'] === 'Female') {
            $total_female++;
        }
    }

    echo json_encode([
        'status' => 'success',
        'advisory' => $advisory,
        'students' => $students,
        'teachers' => $teachers,
        'statistics' => [
            'total_students' => $total_students,
            'total_male' => $total_male,
            'total_female' => $total_female
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