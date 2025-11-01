<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../connection.php';

try {
    // Get Quarter 1 start date (reference date for age computation)
    $stmt = $conn->prepare('SELECT start_date FROM tbl_quarters WHERE quarter_id = 1 ORDER BY start_date DESC LIMIT 1');
    $stmt->execute();
    $quarter1 = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$quarter1 || !$quarter1['start_date']) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error', 
            'message' => 'Quarter 1 start date not found in database'
        ]);
        exit;
    }
    
    $referenceDate = new DateTime($quarter1['start_date']);
    $referenceDateStr = $referenceDate->format('Y-m-d');
    
    // Calculate date ranges for each level based on reference date
    // The ranges are determined so that a student born in that range will be the correct age at the reference date
    // Level 1 (Discoverer): Age 1.8-3 years at reference date
    // - End date: reference date - 1 year - 10 months (2 months before turning 2 years old)
    //   1.8 years = 1 year + 10 months (approximately 22 months, which is 2 months before 24 months/2 years)
    // - Start date: reference date - 3 years + 1 day (oldest birthdate for Level 1, exclusive of 3 years)
    
    // Calculate 1.8 years as 1 year and 10 months (2 months before turning 2)
    $level1End = clone $referenceDate;
    $level1End->modify('-1 year')->modify('-10 months');
    
    $level1Start = clone $referenceDate;
    $level1Start->modify('-3 years')->modify('+1 day');
    
    // Level 2 (Explorer): Age 3-4 years at reference date  
    // - End date: reference date - 3 years (most recent birthdate for Level 2)
    // - Start date: reference date - 4 years + 1 day (oldest birthdate for Level 2)
    $level2End = clone $referenceDate;
    $level2End->modify('-3 years');
    
    $level2Start = clone $referenceDate;
    $level2Start->modify('-4 years')->modify('+1 day');
    
    // Level 3 (Adventurer): Age 4-5 years at reference date
    // - End date: reference date - 4 years (most recent birthdate for Level 3)
    // - Start date: reference date - 5 years + 1 day (oldest birthdate for Level 3)
    $level3End = clone $referenceDate;
    $level3End->modify('-4 years');
    
    $level3Start = clone $referenceDate;
    $level3Start->modify('-5 years')->modify('+1 day');
    
    // Format dates for response
    $result = [
        'status' => 'success',
        'reference_date' => $referenceDateStr,
        'reference_date_formatted' => $referenceDate->format('F j, Y'),
        'levels' => [
            1 => [
                'name' => 'Discoverer',
                'age_range' => '1.8-3 years',
                'start_date' => $level1Start->format('Y-m-d'),
                'end_date' => $level1End->format('Y-m-d'),
                'start_date_formatted' => $level1Start->format('M j, Y'),
                'end_date_formatted' => $level1End->format('M j, Y'),
            ],
            2 => [
                'name' => 'Explorer',
                'age_range' => '3-4 years',
                'start_date' => $level2Start->format('Y-m-d'),
                'end_date' => $level2End->format('Y-m-d'),
                'start_date_formatted' => $level2Start->format('M j, Y'),
                'end_date_formatted' => $level2End->format('M j, Y'),
            ],
            3 => [
                'name' => 'Adventurer',
                'age_range' => '4-5 years',
                'start_date' => $level3Start->format('Y-m-d'),
                'end_date' => $level3End->format('Y-m-d'),
                'start_date_formatted' => $level3Start->format('M j, Y'),
                'end_date_formatted' => $level3End->format('M j, Y'),
            ],
        ]
    ];
    
    echo json_encode($result);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error', 
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Error calculating age requirements', 
        'error' => $e->getMessage()
    ]);
}

