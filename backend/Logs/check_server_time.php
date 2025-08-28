<?php
// Server time check and diagnosis script
header("Content-Type: text/plain");

echo "=== Server Time Diagnosis ===\n\n";

// Check PHP time settings
echo "1. PHP Time Settings:\n";
echo "   PHP Version: " . phpversion() . "\n";
echo "   Default Timezone: " . date_default_timezone_get() . "\n";
echo "   Current PHP Time: " . date('Y-m-d H:i:s') . "\n";
echo "   Current PHP Timestamp: " . time() . "\n\n";

// Check system time
echo "2. System Time:\n";
if (function_exists('shell_exec')) {
    $systemTime = shell_exec('date 2>/dev/null');
    if ($systemTime) {
        echo "   System Date: " . trim($systemTime) . "\n";
    } else {
        echo "   System Date: Unable to get (shell_exec disabled)\n";
    }
} else {
    echo "   System Date: shell_exec function disabled\n";
}

// Check if we can get time from external source
echo "   Attempting to get time from external source...\n";
$externalTime = @file_get_contents('http://worldtimeapi.org/api/timezone/Etc/UTC');
if ($externalTime) {
    $timeData = json_decode($externalTime, true);
    if ($timeData && isset($timeData['datetime'])) {
        echo "   External UTC Time: " . $timeData['datetime'] . "\n";
        $externalTimestamp = strtotime($timeData['datetime']);
        $localTimestamp = time();
        $difference = $localTimestamp - $externalTimestamp;
        echo "   Time Difference from UTC: " . $difference . " seconds\n";
        
        if (abs($difference) > 300) { // More than 5 minutes
            echo "   ⚠️  WARNING: Server time is significantly off!\n";
        } else {
            echo "   ✅ Server time appears to be accurate\n";
        }
    }
} else {
    echo "   External Time: Unable to fetch\n";
}

echo "\n";

// Check database time
echo "3. Database Time:\n";
try {
    include_once '../connection.php';
    
    // Get database time
    $dbTimeQuery = $conn->query("SELECT NOW() as db_time, UNIX_TIMESTAMP() as db_timestamp");
    $dbTimeResult = $dbTimeQuery->fetch(PDO::FETCH_ASSOC);
    
    echo "   Database Time: " . $dbTimeResult['db_time'] . "\n";
    echo "   Database Timestamp: " . $dbTimeResult['db_timestamp'] . "\n";
    
    // Compare with PHP time
    $phpTimestamp = time();
    $dbTimestamp = $dbTimeResult['db_timestamp'];
    $dbDifference = $phpTimestamp - $dbTimestamp;
    
    echo "   PHP vs Database difference: " . $dbDifference . " seconds\n";
    
    if (abs($dbDifference) > 5) {
        echo "   ⚠️  WARNING: PHP and database time are significantly different!\n";
    } else {
        echo "   ✅ PHP and database time are synchronized\n";
    }
    
} catch (Exception $e) {
    echo "   Database Time: Error - " . $e->getMessage() . "\n";
}

echo "\n";

// Check specific timezone settings
echo "4. Timezone Information:\n";
$timezones = [
    'America/Los_Angeles' => 'Pacific Time (UTC-8)',
    'America/New_York' => 'Eastern Time (UTC-5)',
    'Europe/London' => 'UK Time (UTC+0)',
    'Asia/Manila' => 'Philippines Time (UTC+8)',
    'Asia/Tokyo' => 'Japan Time (UTC+9)',
    'Australia/Sydney' => 'Sydney Time (UTC+10)'
];

foreach ($timezones as $tz => $description) {
    $dateTime = new DateTime('now', new DateTimeZone($tz));
    echo "   $description: " . $dateTime->format('Y-m-d H:i:s') . "\n";
}

echo "\n";

// Recommendations
echo "5. Recommendations:\n";
echo "   - Check Windows system time and timezone settings\n";
echo "   - Verify XAMPP php.ini timezone setting\n";
echo "   - Ensure MySQL timezone is correct\n";
echo "   - Consider using UTC timezone for consistency\n";
echo "   - Restart Apache and MySQL after changes\n";

echo "\n=== Diagnosis Complete ===\n";
?> 