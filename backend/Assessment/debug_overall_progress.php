<?php
require_once __DIR__ . '/../connection.php';

// Simulate the exact logic from get_overall_progress_notifications.php
$user_role = 'Teacher';
$user_id = '5'; // Assuming this is Jessa Decena's user ID

// Test message from the image
$message = "[OVERALL PROGRESS] Overall progress for Richard Montizor Gamon has been updated by Jessa Decena.";
$created_by = '5'; // Assuming this is the created_by value

echo "Testing conversion logic:\n";
echo "User Role: $user_role\n";
echo "User ID: $user_id\n";
echo "Created By: $created_by\n";
echo "Message: $message\n\n";

// Check the condition
$condition = ($user_role === 'Teacher' && $created_by == $user_id);
echo "Condition check: ($user_role === 'Teacher' && $created_by == $user_id) = " . ($condition ? 'TRUE' : 'FALSE') . "\n\n";

if ($condition) {
    echo "Condition is TRUE, checking message format...\n";
    
    if (strpos($message, '[OVERALL PROGRESS] Overall progress for') !== false) {
        echo "✓ Message contains '[OVERALL PROGRESS] Overall progress for'\n";
        
        // Test finalized pattern
        if (preg_match('/Overall progress for (.+?) has been finalized by (.+?)\./', $message, $matches)) {
            echo "✓ Matched 'finalized' pattern\n";
            $studentName = $matches[1];
            $formattedMessage = "[OVERALL PROGRESS] You finalized the overall progress for $studentName.";
            echo "Converted to: $formattedMessage\n";
        } 
        // Test updated pattern
        else if (preg_match('/Overall progress for (.+?) has been updated by (.+?)\./', $message, $matches)) {
            echo "✓ Matched 'updated' pattern\n";
            $studentName = $matches[1];
            $formattedMessage = "[OVERALL PROGRESS] You updated the overall progress for $studentName.";
            echo "Converted to: $formattedMessage\n";
        } else {
            echo "✗ No pattern matched\n";
            echo "Message didn't match any expected patterns\n";
        }
    } else {
        echo "✗ Message doesn't contain '[OVERALL PROGRESS] Overall progress for'\n";
    }
} else {
    echo "Condition is FALSE, keeping original message\n";
}
?> 