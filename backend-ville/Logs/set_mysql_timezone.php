<?php
// Set MySQL timezone to Philippines (UTC+8)
header("Content-Type: text/plain");

include_once '../connection.php';

try {
    echo "=== Setting MySQL Timezone to Philippines (UTC+8) ===\n\n";
    
    // Check current timezone
    echo "1. Current MySQL Timezone:\n";
    $currentTzQuery = $conn->query("SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz");
    $currentTz = $currentTzQuery->fetch(PDO::FETCH_ASSOC);
    
    echo "   Global timezone: " . $currentTz['global_tz'] . "\n";
    echo "   Session timezone: " . $currentTz['session_tz'] . "\n\n";
    
    // Check current MySQL time
    echo "2. Current MySQL Time:\n";
    $currentTimeQuery = $conn->query("SELECT NOW() as mysql_time, UNIX_TIMESTAMP() as mysql_timestamp");
    $currentTime = $currentTimeQuery->fetch(PDO::FETCH_ASSOC);
    
    echo "   MySQL Time: " . $currentTime['mysql_time'] . "\n";
    echo "   MySQL Timestamp: " . $currentTime['mysql_timestamp'] . "\n\n";
    
    // Set timezone to Philippines (UTC+8)
    echo "3. Setting timezone to Philippines (UTC+8)...\n";
    
    try {
        // Set global timezone
        $setGlobalTz = $conn->query("SET GLOBAL time_zone = '+08:00'");
        echo "   ✅ Global timezone set to +08:00\n";
    } catch (Exception $e) {
        echo "   ⚠️  Warning: Could not set global timezone: " . $e->getMessage() . "\n";
        echo "   This might require SUPER privilege\n";
    }
    
    try {
        // Set session timezone
        $setSessionTz = $conn->query("SET SESSION time_zone = '+08:00'");
        echo "   ✅ Session timezone set to +08:00\n";
    } catch (Exception $e) {
        echo "   ❌ Error setting session timezone: " . $e->getMessage() . "\n";
    }
    
    // Verify the change
    echo "\n4. Verifying timezone change:\n";
    $newTzQuery = $conn->query("SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz");
    $newTz = $newTzQuery->fetch(PDO::FETCH_ASSOC);
    
    echo "   New global timezone: " . $newTz['global_tz'] . "\n";
    echo "   New session timezone: " . $newTz['session_tz'] . "\n\n";
    
    // Check new MySQL time
    echo "5. New MySQL Time:\n";
    $newTimeQuery = $conn->query("SELECT NOW() as mysql_time, UNIX_TIMESTAMP() as mysql_timestamp");
    $newTime = $newTimeQuery->fetch(PDO::FETCH_ASSOC);
    
    echo "   New MySQL Time: " . $newTime['mysql_time'] . "\n";
    echo "   New MySQL Timestamp: " . $newTime['mysql_timestamp'] . "\n\n";
    
    // Compare with PHP time
    echo "6. Time Comparison:\n";
    $phpTime = date('Y-m-d H:i:s');
    $phpTimestamp = time();
    
    echo "   PHP Time: " . $phpTime . "\n";
    echo "   PHP Timestamp: " . $phpTimestamp . "\n";
    echo "   MySQL Time: " . $newTime['mysql_time'] . "\n";
    echo "   MySQL Timestamp: " . $newTime['mysql_timestamp'] . "\n\n";
    
    // Check if times are close
    $timeDiff = abs($phpTimestamp - $newTime['mysql_timestamp']);
    if ($timeDiff <= 5) {
        echo "   ✅ PHP and MySQL times are synchronized (difference: $timeDiff seconds)\n";
    } else {
        echo "   ⚠️  PHP and MySQL times differ by $timeDiff seconds\n";
    }
    
    echo "\n=== Timezone Setup Complete ===\n";
    echo "✅ MySQL timezone has been set to Philippines (UTC+8)\n";
    echo "✅ You can now test logout functionality\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 