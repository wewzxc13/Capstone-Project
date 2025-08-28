<?php
// Dynamic CORS for localhost:3000+
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000"); // fallback
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

require "connection.php"; // Database connection

// Handle CORS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session only if necessary
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Implement brute-force protection
if (!isset($_SESSION['signup_attempts'])) {
    $_SESSION['signup_attempts'] = 0;
}
if ($_SESSION['signup_attempts'] >= 5) {
    echo json_encode(["success" => false, "message" => "Too many signup attempts. Try again later."]);
    exit();
}

// Get JSON request body
$data = json_decode(file_get_contents("php://input"), true);

// Extract and sanitize input fields
$user_name = htmlspecialchars(trim($data['username'] ?? ''));
$user_pass = trim($data['password'] ?? '');
$user_firstname = htmlspecialchars(trim($data['firstName'] ?? ''));
$user_middlename = htmlspecialchars(trim($data['middleName'] ?? ''));
$user_lastname = htmlspecialchars(trim($data['lastName'] ?? ''));
$user_email = filter_var(trim($data['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$user_contact_no = htmlspecialchars(trim($data['contactNo'] ?? ''));

// Validate required fields
if (empty($user_name) || empty($user_pass) || empty($user_firstname) || empty($user_lastname) || empty($user_email)) {
    echo json_encode(["success" => false, "message" => "All required fields must be filled."]);
    exit();
}

// Validate email format
if (!filter_var($user_email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email format."]);
    exit();
}

// Validate password strength
$password_regex = "/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,12}$/";
if (!preg_match($password_regex, $user_pass)) {
    echo json_encode(["success" => false, "message" => "Password must be 8-12 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character."]);
    exit();
}

try {
    // Fetch the role_id for "Parent"
    $stmt_role = $conn->prepare("SELECT role_id FROM tbl_roles WHERE role_name = 'Parent'");
    $stmt_role->execute();
    $role = $stmt_role->fetch(PDO::FETCH_ASSOC);

    if (!$role) {
        echo json_encode(["success" => false, "message" => "Role 'Parent' not found in database."]);
        exit();
    }

    $user_role = $role['role_id']; // Assign the role_id of "Parent"
    $user_status = "Active";

    // Check if username or email already exists
    $stmt_check = $conn->prepare("SELECT user_id FROM tbl_users WHERE user_name = :user_name OR user_email = :user_email");
    $stmt_check->execute(["user_name" => $user_name, "user_email" => $user_email]);

    if ($stmt_check->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(["success" => false, "message" => "Username or Email already exists."]);
        exit();
    }

    // Hash the password before storing
    $hashed_password = password_hash($user_pass, PASSWORD_BCRYPT);

    // Insert new user into the database
    $sql = "INSERT INTO tbl_users (user_name, user_pass, user_role, user_firstname, user_middlename, user_lastname, user_email, user_contact_no, user_status) 
            VALUES (:user_name, :user_pass, :user_role, :user_firstname, :user_middlename, :user_lastname, :user_email, :user_contact_no, :user_status)";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        "user_name" => $user_name,
        "user_pass" => $hashed_password, // Store hashed password
        "user_role" => $user_role,
        "user_firstname" => $user_firstname,
        "user_middlename" => $user_middlename,
        "user_lastname" => $user_lastname,
        "user_email" => $user_email,
        "user_contact_no" => $user_contact_no,
        "user_status" => $user_status,
    ]);

    // Reset signup attempts after successful signup
    $_SESSION['signup_attempts'] = 0;

    echo json_encode(["success" => true, "message" => "Signup successful. You are now registered as a Parent."]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
