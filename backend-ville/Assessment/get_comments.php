<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../connection.php';

$quarter_id = isset($_GET['quarter_id']) ? intval($_GET['quarter_id']) : null;
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
$advisory_id = isset($_GET['advisory_id']) ? intval($_GET['advisory_id']) : null;

try {
    $sql = 'SELECT c.comment_id, c.quarter_id, q.quarter_name, c.comment, c.created_at, c.updated_at, c.commentor_id, CONCAT(u.user_firstname, " ", u.user_middlename, " ", u.user_lastname) AS commentor_name, c.student_id
            FROM tbl_progress_comments c
            LEFT JOIN tbl_quarters q ON c.quarter_id = q.quarter_id
            LEFT JOIN tbl_users u ON c.commentor_id = u.user_id';
    $where = [];
    $params = [];
    if ($quarter_id) { $where[] = 'c.quarter_id = ?'; $params[] = $quarter_id; }
    if ($student_id) { $where[] = 'c.student_id = ?'; $params[] = $student_id; }
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY c.created_at DESC';
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'comments' => $comments]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 