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
    $mail->Subject = "Your Learners' Ville verification code: $otp_code";
    
    // Create robust HTML email template with better compatibility
    $html_body = '
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <!--[if mso]>
        <noscript>
            <xml>
                <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
        </noscript>
        <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
                        <!-- Header with Logo -->
                        <tr>
                            <td style="padding: 40px 30px 30px 30px; text-align: left;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td width="60" style="vertical-align: middle;">
                                            <img src="https://learnersville.vercel.app/assets/image/villelogo.png" alt="Learners Ville Logo" width="50" height="50" style="display: block; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                                        </td>
                                        <td style="vertical-align: middle; padding-left: 15px;">
                                            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #2196F3; font-family: Arial, sans-serif;">Learners\' Ville</h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Verification Message -->
                        <tr>
                            <td style="padding: 0 30px 20px 30px;">
                                <p style="margin: 0; font-size: 16px; color: #333333; font-family: Arial, sans-serif;">Your Learners\' Ville verification code is:</p>
                            </td>
                        </tr>
                        
                        <!-- OTP Code Display -->
                        <tr>
                            <td style="padding: 0 30px 20px 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="background-color: #E3F2FD; border-radius: 12px; padding: 25px; text-align: center; border: 2px solid #2196F3;">
                                            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #1565C0; letter-spacing: 4px; font-family: \'Courier New\', monospace;">' . implode(' ', str_split($otp_code)) . '</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Warning Message -->
                        <tr>
                            <td style="padding: 0 30px 20px 30px;">
                                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.5; font-family: Arial, sans-serif;">This code will expire in 5 minutes and can only be used once. Never share this code with anyone.</p>
                            </td>
                        </tr>
                        
                        <!-- Support Section -->
                        <tr>
                            <td style="padding: 0 30px 30px 30px;">
                                <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6; font-family: Arial, sans-serif;">
                                    If you believe you are getting this email in error or want to close your Learners\' Ville account, please visit our 
                                    <a href="mailto:support@learnersville.com" style="color: #1976D2; text-decoration: none; font-weight: bold;">support center</a>. 
                                    To learn more about Learners\' Ville, please visit 
                                    <a href="https://learnersville.vercel.app" style="color: #1976D2; text-decoration: none; font-weight: bold;">learnersville.vercel.app</a>.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef; text-align: center;">
                                <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold; color: #495057; font-family: Arial, sans-serif;">Learners\' Ville</p>
                                <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.4; font-family: Arial, sans-serif;">
                                    6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines<br>
                                    Learn. Explore. Discover.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>';
    
    // Create plain text version for better compatibility
    $text_body = "
    LEARNERS' VILLE
    
    Your Learners' Ville verification code is: " . implode(' ', str_split($otp_code)) . "
    
    This code will expire in 5 minutes and can only be used once. Never share this code with anyone.
    
    If you believe you are getting this email in error or want to close your Learners' Ville account, please visit our support center. To learn more about Learners' Ville, please visit learnersville.vercel.app.
    
    Learners' Ville
    6-18 st. Barangay Nazareth, Cagayan de Oro, Philippines
    Learn. Explore. Discover.
    ";
    
    $mail->Body = $html_body;
    $mail->AltBody = $text_body;

    $mail->send();

    echo json_encode(['status' => 'success', 'message' => 'OTP sent to your email']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Email failed: ' . $mail->ErrorInfo]);
}

ob_end_flush();
