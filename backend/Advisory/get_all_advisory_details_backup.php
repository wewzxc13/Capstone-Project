<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../connection.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch all advisories with their details
    $stmt = $pdo->prepare("
        SELECT 
            a.advisory_id,
            a.level_id,
            a.lead_teacher_id,
            a.assistant_teacher_id,
            a.total_male,
            a.total_female,
            a.total_students,
            sl.level_name
        FROM tbl_advisory a
        LEFT JOIN tbl_student_levels sl ON a.level_id = sl.level_id
        ORDER BY a.advisory_id
    ");
    $stmt->execute();
    $advisories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // For each advisory, fetch only active assigned students
    foreach ($advisories as &$advisory) {
        $studentStmt = $pdo->prepare("
            SELECT 
                sa.student_id,
                s.stud_firstname,
                s.stud_middlename,
                s.stud_lastname,
                s.parent_id
            FROM tbl_student_assigned sa
            JOIN tbl_students s ON sa.student_id = s.student_id
            WHERE sa.advisory_id = ? AND s.stud_school_status = 'Active'
        ");
        $studentStmt->execute([$advisory['advisory_id']]);
        $advisory['students'] = $studentStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "advisories" => $advisories
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?> 