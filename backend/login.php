<?php
session_start();
// Ensure all responses are JSON
if (!headers_sent()) {
    header('Content-Type: application/json');
}
include_once 'connection.php'; // CORS headers are now handled in connection.php

define("MAX_ATTEMPTS", 10);
define("LOCKOUT_TIME", 300); // 5 minutes

if (!isset($_SESSION['attempts'])) {
    $_SESSION['attempts'] = 0;
}

if (isset($_SESSION['lockout']) && time() < $_SESSION['lockout']) {
    http_response_code(429);
    echo json_encode([
        "success" => false,
        "message" => "Too many failed login attempts. Try again later.",
        "remainingTime" => $_SESSION['lockout'] - time()
    ]);
    exit();
}

try {
    $inputJSON = file_get_contents("php://input");
    $input = json_decode($inputJSON, true);

    if (!isset($input['email'], $input['password'])) {
        throw new Exception("Missing email or password.");
    }

    $email = filter_var(trim($input['email']), FILTER_SANITIZE_EMAIL);
    $password = trim($input['password']);

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format.");
    }

    // Check if email is empty
    if (empty($email)) {
        throw new Exception("Email is required.");
    }

    // Check if password is empty
    if (empty($password)) {
        throw new Exception("Password is required.");
    }

    $query = $conn->prepare("
        SELECT u.*, r.role_name
        FROM tbl_users u
        JOIN tbl_roles r ON u.user_role = r.role_id
        WHERE u.user_email = :email
          AND u.user_status = 'Active'
    ");
    $query->bindParam(":email", $email);
    $query->execute();

    $user = $query->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("Invalid email address.");
    }

    // 🔐 Secure password check with password_verify
    if (!password_verify($password, $user['user_pass'])) {
        throw new Exception("Incorrect password.");
    }

    // Reset attempts on success
    $_SESSION['attempts'] = 0;
    unset($_SESSION['lockout']);

    $token = bin2hex(random_bytes(32));

    $userData = [
        'id' => $user['user_id'],
        'role' => $user['role_name'],
        'email' => $user['user_email'] ?? '',
        'is_new' => $user['is_new'],
        'firstName' => $user['user_firstname'] ?? '',
        'middleName' => $user['user_middlename'] ?? '',
        'lastName' => $user['user_lastname'] ?? ''
    ];
    
    // Log successful login to system logs
    try {
        $logQuery = $conn->prepare("
            INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
            VALUES (:user_id, NULL, NULL, 'Login', NOW())
        ");
        $logQuery->bindParam(":user_id", $user['user_id']);
        $logQuery->execute();
    } catch (Exception $logError) {
        // Don't fail login if logging fails, just log the error
        error_log("Failed to log login: " . $logError->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "token" => $token,
        "userData" => $userData,
        "role" => $user['role_name']
    ]);
    

} catch (Exception $e) {
    $_SESSION['attempts']++;

    if ($_SESSION['attempts'] >= MAX_ATTEMPTS) {
        $_SESSION['lockout'] = time() + LOCKOUT_TIME;
        http_response_code(429);
        echo json_encode([
            "success" => false,
            "message" => "Too many failed attempts. Try again later.",
            "remainingTime" => LOCKOUT_TIME
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage(),
            "remainingAttempts" => MAX_ATTEMPTS - $_SESSION['attempts']
        ]);
    }
}

// Optional debug log
if (isset($e)) {
    $log = date('Y-m-d H:i:s') . " - " . $e->getMessage() . "\n";
    file_put_contents("error_log.txt", $log, FILE_APPEND);
    
    // Only log debug info if variables are set
    if (isset($email)) {
        file_put_contents("debug_login.txt", date('Y-m-d H:i:s') . " - Input: $email\n", FILE_APPEND);
    }
    if (isset($password)) {
        file_put_contents("debug_login.txt", date('Y-m-d H:i:s') . " - Plain Input Password: $password\n", FILE_APPEND);
    }
    if (isset($user) && isset($user['user_pass'])) {
        file_put_contents("debug_login.txt", date('Y-m-d H:i:s') . " - Hashed DB Password: " . $user['user_pass'] . "\n", FILE_APPEND);
    }
}
?>


