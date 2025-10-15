<?php
// Include CORS configuration
include_once 'cors_config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only POST requests are allowed']);
    exit;
}

// Validate file presence
if (!isset($_FILES['photo']) || !is_uploaded_file($_FILES['photo']['tmp_name'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded under field "photo"']);
    exit;
}

// Basic validations
$file       = $_FILES['photo'];
$maxSize    = 5 * 1024 * 1024; // 5MB
$allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Upload error code: ' . $file['error']]);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'File too large. Max 5MB']);
    exit;
}

$originalName = $file['name'];
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExt, true)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Allowed: ' . implode(', ', $allowedExt)]);
    exit;
}

// Sanitize base name
$baseName = pathinfo($originalName, PATHINFO_FILENAME);
$sanitizedBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);

// Generate shorter unique identifier (5 characters instead of long format)
// Use a more reliable method to ensure consistency
$chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
$shortId = '';
for ($i = 0; $i < 5; $i++) {
    $shortId .= $chars[random_int(0, strlen($chars) - 1)];
}
$uniqueName = 'img_' . $shortId . '_' . $sanitizedBase . '.' . $ext;

// Ensure uploads directory exists - use relative path for production compatibility
$uploadsDir = __DIR__ . '/../Uploads';
if (!is_dir($uploadsDir)) {
    if (!mkdir($uploadsDir, 0775, true) && !is_dir($uploadsDir)) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to create uploads directory']);
        exit;
    }
}

// Check if directory is writable
if (!is_writable($uploadsDir)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Uploads directory is not writable']);
    exit;
}

// Debug logging
$debugMessage = date('Y-m-d H:i:s') . " - Upload attempt: Directory: $uploadsDir, Writable: " . (is_writable($uploadsDir) ? 'Yes' : 'No') . ", File: " . $file['name'] . ", Size: " . $file['size'] . ", Generated ID: $shortId\n";
file_put_contents(__DIR__ . '/../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

$targetPath = $uploadsDir . DIRECTORY_SEPARATOR . $uniqueName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save uploaded file']);
    exit;
}

// Build public URL (not returned; frontend prefixes /php/Uploads/)
$publicUrl = $uniqueName;

// Verify file actually exists after upload
if (!file_exists($targetPath)) {
    $errorMessage = date('Y-m-d H:i:s') . " - CRITICAL: File upload reported success but file does not exist: $targetPath\n";
    file_put_contents(__DIR__ . '/../SystemLogs/error_log.txt', $errorMessage, FILE_APPEND);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'File was not saved properly']);
    exit;
}

// Debug logging for successful upload
$debugMessage = date('Y-m-d H:i:s') . " - Upload successful: Target: $targetPath, URL: $publicUrl, Generated ID: $shortId, File exists: " . (file_exists($targetPath) ? 'YES' : 'NO') . "\n";
file_put_contents(__DIR__ . '/../SystemLogs/debug_log.txt', $debugMessage, FILE_APPEND);

echo json_encode([
    'status' => 'success',
    'file_name' => $uniqueName,
    'url' => $uniqueName  // Return only filename, not full URL
]);
?>


