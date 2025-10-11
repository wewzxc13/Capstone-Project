<?php
/**
 * Reusable CORS Configuration
 * Include this file at the top of any API endpoint that needs CORS support
 */

// CORS Configuration - Allow production and development origins
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins
$allowedOrigins = [
    'https://learnersville.online',
    'https://www.learnersville.online',
    'https://learnersville.vercel.app',
    'https://capstone-project-chi-seven.vercel.app',
    'http://localhost:3000',
];

// Check if origin matches localhost:3XXX pattern
if (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif (preg_match('/^https:\/\/.*\.vercel\.app$/', $origin)) {
    // Allow any Vercel preview deployment
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default fallback for development
    header("Access-Control-Allow-Origin: http://localhost:3000");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>

