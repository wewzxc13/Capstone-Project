<?php
/**
 * Configuration Loader
 * Loads environment variables from .env file
 */

// Function to load .env file
function loadEnv($path = __DIR__ . '/.env') {
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            $value = trim($value, '"\'');
            
            // Set as environment variable if not already set
            if (!isset($_ENV[$key]) && !isset($_SERVER[$key])) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}

// Load environment variables
loadEnv();

// Helper function to get environment variable with fallback
function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
    }
    return $value;
}

// CORS Configuration
$corsOrigin = env('CORS_ORIGIN', '*');

// Handle multiple origins (comma-separated)
$allowedOrigins = array_map('trim', explode(',', $corsOrigin));

// Get the request origin
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Default allowed origins (fallback if .env not configured)
$defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://learnersville.online',
    'http://learnersville.online'
];

// Merge with .env origins
if ($corsOrigin !== '*') {
    $allowedOrigins = array_unique(array_merge($allowedOrigins, $defaultAllowedOrigins));
}

// Set CORS headers
if ($corsOrigin === '*') {
    // Allow all origins (development only)
    header("Access-Control-Allow-Origin: *");
} elseif ($requestOrigin && in_array($requestOrigin, $allowedOrigins)) {
    // Origin is in allowed list - reflect it back
    header("Access-Control-Allow-Origin: $requestOrigin");
    header("Vary: Origin");
} elseif ($requestOrigin && (
    // Also allow Vercel preview/production domains dynamically
    preg_match('/^https:\/\/.*\.vercel\.app$/', $requestOrigin) ||
    // Allow learnersville.online and subdomains
    preg_match('/^https?:\/\/(.*\.)?learnersville\.online$/', $requestOrigin)
)) {
    header("Access-Control-Allow-Origin: $requestOrigin");
    header("Vary: Origin");
} else {
    // Fallback to first allowed origin or production domain
    $fallbackOrigin = !empty($allowedOrigins) ? $allowedOrigins[0] : 'https://learnersville.online';
    header("Access-Control-Allow-Origin: $fallbackOrigin");
}

header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Configuration
define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_NAME', env('DB_NAME', 'dblearnsville'));
define('DB_USER', env('DB_USER', 'root'));
define('DB_PASS', env('DB_PASS', ''));

// Environment
define('ENVIRONMENT', env('ENVIRONMENT', 'development'));
define('IS_PRODUCTION', ENVIRONMENT === 'production');
define('IS_DEVELOPMENT', ENVIRONMENT === 'development');

