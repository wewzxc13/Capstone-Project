<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../connection.php';

$input = json_decode(file_get_contents('php://input'), true);
$comment_id = isset($input['comment_id']) ? intval($input['comment_id']) : null;
$comment = isset($input['comment']) ? trim($input['comment']) : null;

if (!$comment_id || !$comment) {
    echo json_encode(['status' => 'error', 'message' => 'Missing comment_id or comment.']);
    exit();
}

try {
    $stmt = $conn->prepare('UPDATE tbl_progress_comments SET comment = ? WHERE comment_id = ?');
    $stmt->execute([$comment, $comment_id]);
    if ($stmt->rowCount() > 0) {
        $stmtMeta = $conn->prepare('SELECT created_at, updated_at FROM tbl_progress_comments WHERE comment_id = ?');
        $stmtMeta->execute([$comment_id]);
        $meta = $stmtMeta->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'created_at' => $meta['created_at'] ?? null, 'updated_at' => $meta['updated_at'] ?? null]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No comment updated.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 