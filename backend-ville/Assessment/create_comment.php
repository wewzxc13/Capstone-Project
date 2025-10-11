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
$comment = isset($input['comment']) ? trim($input['comment']) : null;
$commented_at = isset($input['commented_at']) ? $input['commented_at'] : date('Y-m-d H:i:s');
$commentor_id = isset($input['commentor_id']) ? intval($input['commentor_id']) : null;
$student_id = isset($input['student_id']) ? intval($input['student_id']) : null;

if (!$comment || !$commentor_id || !$student_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing comment, commentor_id, or student_id.']);
    exit();
}

try {
    // Find quarter_id for the given commented_at
    $stmt = $conn->prepare('SELECT quarter_id FROM tbl_quarters WHERE start_date <= ? AND end_date >= ? LIMIT 1');
    $stmt->execute([$commented_at, $commented_at]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['status' => 'error', 'message' => 'No quarter found for the given date.']);
        exit();
    }
    $quarter_id = $row['quarter_id'];

    // Check for existing comment for this user/student/quarter
    $stmtCheck = $conn->prepare('SELECT comment_id FROM tbl_progress_comments WHERE quarter_id = ? AND commentor_id = ? AND student_id = ?');
    $stmtCheck->execute([$quarter_id, $commentor_id, $student_id]);
    if ($stmtCheck->fetch()) {
        // Get quarter name for error message
        $stmtQ = $conn->prepare('SELECT quarter_name FROM tbl_quarters WHERE quarter_id = ?');
        $stmtQ->execute([$quarter_id]);
        $qRow = $stmtQ->fetch(PDO::FETCH_ASSOC);
        $qName = $qRow ? $qRow['quarter_name'] : '';
        echo json_encode(['status' => 'error', 'message' => "You have already commented for $qName. Wait for the next quarter."]);
        exit();
    }
    // Insert comment (created_at and updated_at handled by DB)
    $stmt2 = $conn->prepare('INSERT INTO tbl_progress_comments (quarter_id, comment, commentor_id, student_id) VALUES (?, ?, ?, ?)');
    $stmt2->execute([$quarter_id, $comment, $commentor_id, $student_id]);
    $comment_id = $conn->lastInsertId();
    // Fetch created_at and updated_at
    $stmtMeta = $conn->prepare('SELECT created_at, updated_at FROM tbl_progress_comments WHERE comment_id = ?');
    $stmtMeta->execute([$comment_id]);
    $meta = $stmtMeta->fetch(PDO::FETCH_ASSOC);
    // Get quarter name for response
    $stmtQ = $conn->prepare('SELECT quarter_name FROM tbl_quarters WHERE quarter_id = ?');
    $stmtQ->execute([$quarter_id]);
    $qRow = $stmtQ->fetch(PDO::FETCH_ASSOC);
    $qName = $qRow ? $qRow['quarter_name'] : '';
    // Get commentor full name for response
    $stmtUser = $conn->prepare('SELECT CONCAT(user_firstname, " ", user_middlename, " ", user_lastname) AS commentor_name FROM tbl_users WHERE user_id = ?');
    $stmtUser->execute([$commentor_id]);
    $userRow = $stmtUser->fetch(PDO::FETCH_ASSOC);
    $commentor_name = $userRow ? trim(preg_replace('/\s+/', ' ', $userRow['commentor_name'])) : '';
    echo json_encode([
        'status' => 'success',
        'comment_id' => $comment_id,
        'quarter_id' => $quarter_id,
        'quarter_name' => $qName,
        'comment' => $comment,
        'created_at' => $meta['created_at'] ?? null,
        'updated_at' => $meta['updated_at'] ?? null,
        'commentor_id' => $commentor_id,
        'commentor_name' => $commentor_name,
        'student_id' => $student_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 