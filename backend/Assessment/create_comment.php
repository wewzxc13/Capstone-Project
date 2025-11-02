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
$commentor_id = isset($input['commentor_id']) ? intval($input['commentor_id']) : null;
$student_id = isset($input['student_id']) ? intval($input['student_id']) : null;
$quarter_id = isset($input['quarter_id']) ? intval($input['quarter_id']) : null;

if (!$comment || !$commentor_id || !$student_id || !$quarter_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing comment, commentor_id, student_id, or quarter_id.']);
    exit();
}

try {
    // Verify that the quarter exists
    $stmt = $conn->prepare('SELECT quarter_id, quarter_name FROM tbl_quarters WHERE quarter_id = ?');
    $stmt->execute([$quarter_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid quarter selected.']);
        exit();
    }
    $quarter_name = $row['quarter_name'];
    
    // Verify that the student has a finalized progress card for this quarter
    // Get advisory_id from tbl_student_assigned (students are linked to advisories through this table)
    $stmtStudent = $conn->prepare('SELECT advisory_id FROM tbl_student_assigned WHERE student_id = ? LIMIT 1');
    $stmtStudent->execute([$student_id]);
    $studentRow = $stmtStudent->fetch(PDO::FETCH_ASSOC);
    if (!$studentRow || !$studentRow['advisory_id']) {
        echo json_encode(['status' => 'error', 'message' => 'Student advisory not found.']);
        exit();
    }
    $advisory_id = $studentRow['advisory_id'];
    
    // Check if progress card exists and is finalized for this quarter
    $stmtProgress = $conn->prepare('SELECT card_id FROM tbl_progress_cards WHERE student_id = ? AND advisory_id = ? AND quarter_id = ? AND is_finalized = 1');
    $stmtProgress->execute([$student_id, $advisory_id, $quarter_id]);
    if (!$stmtProgress->fetch()) {
        echo json_encode(['status' => 'error', 'message' => "Cannot comment on $quarter_name. The quarter must be finalized first."]);
        exit();
    }

    // Check for existing comment for this user/student/quarter
    $stmtCheck = $conn->prepare('SELECT comment_id FROM tbl_progress_comments WHERE quarter_id = ? AND commentor_id = ? AND student_id = ?');
    $stmtCheck->execute([$quarter_id, $commentor_id, $student_id]);
    if ($stmtCheck->fetch()) {
        echo json_encode(['status' => 'error', 'message' => "You have already commented for $quarter_name. Please select another quarter."]);
        exit();
    }
    // Insert comment with explicit timestamp using MySQL NOW() to ensure correct timezone
    $stmt2 = $conn->prepare('INSERT INTO tbl_progress_comments (quarter_id, comment, commentor_id, student_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())');
    $stmt2->execute([$quarter_id, $comment, $commentor_id, $student_id]);
    $comment_id = $conn->lastInsertId();
    // Fetch created_at and updated_at
    $stmtMeta = $conn->prepare('SELECT created_at, updated_at FROM tbl_progress_comments WHERE comment_id = ?');
    $stmtMeta->execute([$comment_id]);
    $meta = $stmtMeta->fetch(PDO::FETCH_ASSOC);
    // Get commentor full name for response
    $stmtUser = $conn->prepare('SELECT CONCAT(user_firstname, " ", user_middlename, " ", user_lastname) AS commentor_name FROM tbl_users WHERE user_id = ?');
    $stmtUser->execute([$commentor_id]);
    $userRow = $stmtUser->fetch(PDO::FETCH_ASSOC);
    $commentor_name = $userRow ? trim(preg_replace('/\s+/', ' ', $userRow['commentor_name'])) : '';
    echo json_encode([
        'status' => 'success',
        'comment_id' => $comment_id,
        'quarter_id' => $quarter_id,
        'quarter_name' => $quarter_name,
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