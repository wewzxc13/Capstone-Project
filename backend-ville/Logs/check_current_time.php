<?php
// Check current server time
header("Content-Type: text/plain");

echo "=== Current Server Time Check ===\n\n";

// PHP time
echo "1. PHP Time:\n";
echo "   Current Date: " . date('Y-m-d') . "\n";
echo "   Current Time: " . date('H:i:s') . "\n";
echo "   Full Timestamp: " . date('Y-m-d H:i:s') . "\n";
echo "   Unix Timestamp: " . time() . "\n\n";

// Check if date is in the future
$currentYear = date('Y');
$currentMonth = date('m');
$currentDay = date('d');

echo "2. Date Analysis:\n";
echo "   Year: $currentYear\n";
echo "   Month: $currentMonth\n";
echo "   Day: $currentDay\n";

if ($currentYear > 2024) {
    echo "   ⚠️  WARNING: Year is in the future! ($currentYear > 2024)\n";
} elseif ($currentYear < 2024) {
    echo "   ⚠️  WARNING: Year is in the past! ($currentYear < 2024)\n";
} else {
    echo "   ✅ Year is correct (2024)\n";
}

echo "\n";

// Database time
echo "3. Database Time:\n";
try {
    include_once '../connection.php';
    
    $dbTimeQuery = $conn->query("SELECT NOW() as db_time, CURDATE() as db_date, CURTIME() as db_time_only");
    $dbTime = $dbTimeQuery->fetch(PDO::FETCH_ASSOC);
    
    echo "   Database Date: " . $dbTime['db_date'] . "\n";
    echo "   Database Time: " . $dbTime['db_time_only'] . "\n";
    echo "   Full Database Timestamp: " . $dbTime['db_time'] . "\n";
    
    // Check if database date is in the future
    $dbYear = substr($dbTime['db_date'], 0, 4);
    if ($dbYear > 2024) {
        echo "   ⚠️  WARNING: Database date is in the future! ($dbYear > 2024)\n";
    } elseif ($dbYear < 2024) {
        echo "   ⚠️  WARNING: Database date is in the past! ($dbYear < 2024)\n";
    } else {
        echo "   ✅ Database date is correct (2024)\n";
    }
    
} catch (Exception $e) {
    echo "   Database Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Recommendations
echo "4. Immediate Actions Required:\n";
echo "   - Fix Windows system date to August 12, 2024 (or today)\n";
echo "   - Restart XAMPP (Apache + MySQL)\n";
echo "   - Run this script again to verify\n";
echo "   - Then test logout functionality\n";

echo "\n=== Time Check Complete ===\n";
?> 