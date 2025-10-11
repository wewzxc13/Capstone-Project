<?php
// Dynamic CORS configuration to support credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://learnersville.online',
    'http://learnersville.online'
];

// Set CORS headers based on origin
if (empty($origin)) {
    // Same-origin request - set default origin
    header("Access-Control-Allow-Origin: https://learnersville.online");
} elseif (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin) || in_array($origin, $allowedOrigins)) {
    // Cross-origin request from allowed origin
    header("Access-Control-Allow-Origin: $origin");
} elseif (preg_match('/^https:\/\/.*\.vercel\.app$/', $origin)) {
    // ✅ Allow all Vercel deployments (production + preview)
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
} else {
    // Fallback - allow production domain
    header("Access-Control-Allow-Origin: https://learnersville.online");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Updated with Namecheap credentials
$servername = "localhost";
$dbname = "learwdxg_ville";
$username = "learwdxg_dichos";
$password = "Dichos_114!";

try {
    // Create PDO connection
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Log error silently
    error_log("Database connection failed: " . $e->getMessage());
    $conn = null;
}
?>
