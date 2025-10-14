<?php
// Simple CORS test endpoint
header('Content-Type: application/json');

// Get the origin
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'NO_ORIGIN_HEADER';

// Define allowed origins
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://learnersville.online',
    'http://learnersville.online'
];

// Log all headers for debugging
$headers = [];
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $headers[$key] = $value;
    }
}

// Set CORS headers
if (empty($origin) || $origin === 'NO_ORIGIN_HEADER') {
    header("Access-Control-Allow-Origin: https://learnersville.online");
    $corsDecision = "No origin header - defaulting to https://learnersville.online";
} elseif (preg_match('/^http:\/\/localhost:3[0-9]{3,}$/', $origin) || in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    $corsDecision = "Origin matched allowed list - echoing back: $origin";
} else {
    header("Access-Control-Allow-Origin: https://learnersville.online");
    $corsDecision = "Origin not in allowed list - defaulting to https://learnersville.online";
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Return debug information
echo json_encode([
    'success' => true,
    'message' => 'CORS test endpoint',
    'debug' => [
        'origin_header' => $origin,
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'request_uri' => $_SERVER['REQUEST_URI'],
        'server_name' => $_SERVER['SERVER_NAME'],
        'http_host' => $_SERVER['HTTP_HOST'] ?? 'not set',
        'cors_decision' => $corsDecision,
        'all_http_headers' => $headers,
        'allowed_origins' => $allowedOrigins
    ]
], JSON_PRETTY_PRINT);
?>

