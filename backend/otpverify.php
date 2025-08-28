<?php
include_once 'connection.php';

// Helper to log password change without affecting OTP flow if it fails
function logPasswordChange($conn, $user_id) {
	try {
		$query = $conn->prepare("INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
								VALUES (:user_id, :target_user_id, NULL, 'Changed password', NOW())");
		$query->bindParam(':user_id', $user_id);
		$query->bindParam(':target_user_id', $user_id);
		$query->execute();
	} catch (Exception $e) {
		// Soft-fail: do not break OTP verification flow
		@file_put_contents(__DIR__ . '/SystemLogs/error_log.txt', date('Y-m-d H:i:s') . " - Failed to log password change for user {$user_id}: " . $e->getMessage() . "\n", FILE_APPEND);
	}
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

$user_id = $_POST['user_id'] ?? '';
$otp_code = $_POST['otp'] ?? '';
$new_password = $_POST['new_password'] ?? '';

if (!$user_id || !$otp_code || !$new_password) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Get latest OTP for this user
$stmt = $conn->prepare("SELECT * FROM tbl_otp_verification WHERE user_id = :user_id ORDER BY otp_id DESC LIMIT 1");
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();
$otpRecord = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$otpRecord) {
    echo json_encode(['status' => 'error', 'message' => 'No OTP found for this user']);
    exit;
}

$currentTime = date("Y-m-d H:i:s");

if ($otpRecord['otp_code'] !== $otp_code) {
    echo json_encode(['status' => 'error', 'message' => 'Incorrect OTP']);
    exit;
}

if ($otpRecord['expires_at'] < $currentTime) {
    echo json_encode(['status' => 'error', 'message' => 'OTP has expired']);
    exit;
}

if ($otpRecord['is_verified'] === 'Yes') {
    echo json_encode(['status' => 'error', 'message' => 'OTP has already been used']);
    exit;
}

// ✅ Mark OTP as verified
$updateOTP = $conn->prepare("UPDATE tbl_otp_verification SET is_verified = 'Yes' WHERE otp_id = :otp_id");
$updateOTP->bindParam(':otp_id', $otpRecord['otp_id']);
$updateOTP->execute();

// ✅ Hash and update user's password
$hashedPassword = password_hash($new_password, PASSWORD_BCRYPT);
$updateUser = $conn->prepare("UPDATE tbl_users SET user_pass = :pass, is_new = 'No' WHERE user_id = :user_id");
$updateUser->bindParam(':pass', $hashedPassword);
$updateUser->bindParam(':user_id', $user_id);
$updateUser->execute();

// ✅ Log password change to system logs (non-blocking)
logPasswordChange($conn, $user_id);

// Optionally fetch updated user info
$getUser = $conn->prepare("SELECT * FROM tbl_users WHERE user_id = :user_id");
$getUser->bindParam(':user_id', $user_id);
$getUser->execute();
$user = $getUser->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'status' => 'success',
    'message' => 'OTP verified and password changed successfully',
    'user' => $user ?: null
]);
