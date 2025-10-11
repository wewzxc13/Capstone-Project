<?php
// Enable CORS and content handling
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once 'connection.php';

// Show errors for development (disable on production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    $inputJSON = file_get_contents("php://input");
    $input = json_decode($inputJSON, true);

    if (!isset($input['email'], $input['new_password'], $input['confirm_password'])) {
        throw new Exception("Missing required fields.");
    }

    $email = trim($input['email']);
    $newPassword = trim($input['new_password']);
    $confirmPassword = trim($input['confirm_password']);
    $currentPassword = isset($input['current_password']) ? trim($input['current_password']) : "";
    $mode = isset($input['mode']) ? $input['mode'] : 'change'; // default to 'change' if not provided

    if ($email === "" || $newPassword === "" || $confirmPassword === "") {
        throw new Exception("All fields are required.");
    }

    // Fetch user by email
    $stmt = $conn->prepare("SELECT user_id, user_pass, user_email, is_new FROM tbl_users WHERE user_email = :email");
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("No user found with this email.");
    }

    if ($mode === "change") {
        // If user is not new, require current password check
        if ($user['is_new'] === "No") {
            if ($currentPassword === "") {
                throw new Exception("Current password is required.");
            }
            if (!password_verify($currentPassword, $user['user_pass'])) {
                throw new Exception("Current password is incorrect.");
            }
            if (password_verify($newPassword, $user['user_pass'])) {
                throw new Exception("New password must be different from the current one.");
            }
        }
    } else if ($mode === "forgot") {
        // In forgot mode, do NOT require current password, even for is_new = No
        if (password_verify($newPassword, $user['user_pass'])) {
            throw new Exception("New password must be different from the current one.");
        }
    }

    if ($newPassword !== $confirmPassword) {
        throw new Exception("Passwords do not match.");
    }

    // ✅ Do NOT update the password yet – wait for OTP verification
    // Store password temporarily in frontend (e.g., localStorage)
    // Note: Password change will be logged only after successful OTP verification

    echo json_encode([
        "success" => true,
        "message" => "OTP will be sent to your email.",
        "redirect" => "otp",
        "user_id" => $user['user_id'],
        "email" => $user['user_email']
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
