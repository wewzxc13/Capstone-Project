<?php
require_once 'connection.php';

echo "=== Testing Overall Progress Notification Format ===\n\n";

// Get recent overall progress notifications
$stmt = $conn->prepare("SELECT notif_message, created_by, created_at FROM tbl_notifications WHERE notif_message LIKE '%OVERALL PROGRESS%' ORDER BY created_at DESC LIMIT 10");
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($results) . " overall progress notifications:\n\n";

foreach ($results as $row) {
    echo "Message: " . $row['notif_message'] . "\n";
    echo "Created by: " . $row['created_by'] . "\n";
    echo "Created at: " . $row['created_at'] . "\n";
    echo "---\n";
}

// Test regex patterns
echo "\n=== Testing Regex Patterns ===\n";

$testMessages = [
    "[OVERALL PROGRESS] Overall progress for Richard Montizor Gamon has been updated by Jessa Decena.",
    "[OVERALL PROGRESS] Overall progress for Jamica Placido has been finalized by Jessa Decena.",
    "[OVERALL PROGRESS] You finalized the overall progress for Jamica Placido."
];

foreach ($testMessages as $message) {
    echo "\nTesting: " . $message . "\n";
    
    // Test finalized pattern
    if (preg_match('/Overall progress for (.+?) has been finalized by (.+?)\./', $message, $matches)) {
        echo "  ✓ Matched 'finalized' pattern\n";
        echo "  Student: " . $matches[1] . "\n";
        echo "  Teacher: " . $matches[2] . "\n";
    } else {
        echo "  ✗ No match for 'finalized' pattern\n";
    }
    
    // Test updated pattern
    if (preg_match('/Overall progress for (.+?) has been updated by (.+?)\./', $message, $matches)) {
        echo "  ✓ Matched 'updated' pattern\n";
        echo "  Student: " . $matches[1] . "\n";
        echo "  Teacher: " . $matches[2] . "\n";
    } else {
        echo "  ✗ No match for 'updated' pattern\n";
    }
}
?> 