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

try {
    // Get all class levels
    $stmt = $conn->prepare('SELECT level_id, level_name FROM tbl_student_levels');
    $stmt->execute();
    $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // For each class, count how many advisories (lead+assistant) are assigned
    $result = [];
    foreach ($levels as $level) {
        $level_id = $level['level_id'];
        // Count lead teachers
        $stmtLead = $conn->prepare('SELECT COUNT(*) FROM tbl_advisory WHERE lead_teacher_id IS NOT NULL AND level_id = ?');
        $stmtLead->execute([$level_id]);
        $leadCount = (int)$stmtLead->fetchColumn();
        // Count assistant teachers
        $stmtAsst = $conn->prepare('SELECT COUNT(*) FROM tbl_advisory WHERE assistant_teacher_id IS NOT NULL AND level_id = ?');
        $stmtAsst->execute([$level_id]);
        $asstCount = (int)$stmtAsst->fetchColumn();
        $assignedCount = $leadCount + $asstCount;
        $result[] = [
            'level_id' => $level_id,
            'level_name' => $level['level_name'],
            'assigned_count' => $assignedCount,
            'max_teachers' => 2
        ];
    }
    echo json_encode(['status' => 'success', 'levels' => $result]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 