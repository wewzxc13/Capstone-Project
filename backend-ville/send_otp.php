<?php
// Show PHP errors during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);
ob_start(); // Prevent any accidental output

header('Content-Type: application/json');

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Fatal server error: ' . $error['message']]);
        }
    }
});

include_once 'connection.php';

// ✅ Composer autoloader (assumes verification/ folder is present)
require __DIR__ . '/verification/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Get input
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

// Support JSON or FormData
$user_id = $data['user_id'] ?? $_POST['user_id'] ?? '';
$email = $data['email'] ?? $_POST['email'] ?? '';

if (!$user_id || !$email) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user_id or email']);
    exit;
}

// Generate OTP
$otp_code = strval(rand(100000, 999999));
$expires_at = date("Y-m-d H:i:s", strtotime("+5 minutes"));

// Save to DB
$stmt = $conn->prepare("INSERT INTO tbl_otp_verification (user_id, otp_code, expires_at, is_verified)
                        VALUES (:user_id, :otp_code, :expires_at, 'No')");
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':otp_code', $otp_code);
$stmt->bindParam(':expires_at', $expires_at);

if (!$stmt->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save OTP to database']);
    exit;
}

// Send Email
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'clarinochristian924@gmail.com';
    $mail->Password = 'dvesjlxsdmwmvziv';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    $mail->setFrom('clarinochristian924@gmail.com', 'LearnersVille OTP');
    $mail->addAddress($email);
    $mail->isHTML(true);
    $mail->Subject = 'Your OTP Code';
    $mail->Body = "
        <h2>OTP Verification</h2>
        <p>Your OTP code is: <strong>$otp_code</strong></p>
        <p>This code will expire in <strong>5 minutes</strong>.</p>
    ";

    $mail->send();

    echo json_encode(['status' => 'success', 'message' => 'OTP sent to your email']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Email failed: ' . $mail->ErrorInfo]);
}

ob_end_flush();
