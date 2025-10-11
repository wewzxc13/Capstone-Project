<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Only POST requests are accepted.'
    ]);
    exit();
}

// Include database connection
include_once '../connection.php';

try {
    // Use the existing connection
    $pdo = $conn;
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate input structure
    if (!isset($input['quarters']) || !is_array($input['quarters'])) {
        throw new Exception('Quarters data is required and must be an array');
    }
    
    $quarters = $input['quarters'];
    
    // Validate each quarter
    $validatedQuarters = [];
    foreach ($quarters as $quarter) {
        // Required fields validation
        if (!isset($quarter['quarter_id']) || !isset($quarter['quarter_name']) || 
            !isset($quarter['start_date']) || !isset($quarter['end_date'])) {
            throw new Exception('All fields (quarter_id, quarter_name, start_date, end_date) are required');
        }
        
        // Quarter ID validation
        if (!is_numeric($quarter['quarter_id']) || $quarter['quarter_id'] <= 0) {
            throw new Exception('Invalid quarter ID');
        }
        
        // Quarter name validation
        if (empty(trim($quarter['quarter_name'])) || strlen(trim($quarter['quarter_name'])) < 3) {
            throw new Exception('Quarter name must be at least 3 characters long');
        }
        
        if (strlen(trim($quarter['quarter_name'])) > 50) {
            throw new Exception('Quarter name cannot exceed 50 characters');
        }
        
        // Date validation
        $startDate = DateTime::createFromFormat('Y-m-d', $quarter['start_date']);
        $endDate = DateTime::createFromFormat('Y-m-d', $quarter['end_date']);
        
        if (!$startDate || !$endDate) {
            throw new Exception('Invalid date format. Use YYYY-MM-DD format');
        }
        
        // Check if start date is before end date
        if ($startDate >= $endDate) {
            throw new Exception('Start date must be before end date');
        }
        
        // Check quarter duration (30-120 days)
        $interval = $startDate->diff($endDate);
        $daysDiff = $interval->days;
        
        if ($daysDiff < 30) {
            throw new Exception('Quarter must be at least 30 days long');
        }
        
        if ($daysDiff > 120) {
            throw new Exception('Quarter cannot exceed 120 days');
        }
        
        $validatedQuarters[] = [
            'quarter_id' => (int)$quarter['quarter_id'],
            'quarter_name' => trim($quarter['quarter_name']),
            'start_date' => $quarter['start_date'],
            'end_date' => $quarter['end_date']
        ];
    }
    
    // Sort quarters by quarter_id to ensure proper order
    usort($validatedQuarters, function($a, $b) {
        return $a['quarter_id'] - $b['quarter_id'];
    });
    
    // Validate chronological order and check for overlaps
    for ($i = 0; $i < count($validatedQuarters) - 1; $i++) {
        $currentQuarter = $validatedQuarters[$i];
        $nextQuarter = $validatedQuarters[$i + 1];
        
        $currentEnd = DateTime::createFromFormat('Y-m-d', $currentQuarter['end_date']);
        $nextStart = DateTime::createFromFormat('Y-m-d', $nextQuarter['start_date']);
        
        // Check if current quarter ends before next quarter starts
        if ($currentEnd >= $nextStart) {
            throw new Exception("Quarter {$currentQuarter['quarter_name']} must end before {$nextQuarter['quarter_name']} starts");
        }
        
        // Check for large gaps (more than 30 days)
        $gap = $currentEnd->diff($nextStart);
        if ($gap->days > 30) {
            // This is a warning, not an error
            error_log("Warning: Large gap of {$gap->days} days between quarters {$currentQuarter['quarter_name']} and {$nextQuarter['quarter_name']}");
        }
    }
    
    // Validate school year spans reasonable time (typically 9-12 months)
    $firstQuarterStart = DateTime::createFromFormat('Y-m-d', $validatedQuarters[0]['start_date']);
    $lastQuarterEnd = DateTime::createFromFormat('Y-m-d', $validatedQuarters[count($validatedQuarters) - 1]['end_date']);
    
    $schoolYearDuration = $firstQuarterStart->diff($lastQuarterEnd);
    $totalDays = $schoolYearDuration->days;
    
    // Calculate months by counting the actual months the school year spans
    $startYear = (int)$firstQuarterStart->format('Y');
    $startMonth = (int)$firstQuarterStart->format('n');
    $endYear = (int)$lastQuarterEnd->format('Y');
    $endMonth = (int)$lastQuarterEnd->format('n');
    
    $totalMonths = (($endYear - $startYear) * 12) + ($endMonth - $startMonth) + 1;
    
    if ($totalMonths < 9) {
        throw new Exception('School year seems too short. Total duration: ' . $totalMonths . ' months');
    }
    
    if ($totalMonths > 12) {
        throw new Exception('School year seems too long. Total duration: ' . $totalMonths . ' months');
    }
    
    // Check if school year is not too far in the past or future
    $currentYear = (int)date('Y');
    $firstQuarterYear = (int)$firstQuarterStart->format('Y');
    
    if ($firstQuarterYear < $currentYear - 2) {
        throw new Exception('School year cannot start more than 2 years in the past');
    }
    
    if ($firstQuarterYear > $currentYear + 1) {
        throw new Exception('School year cannot start more than 1 year in the future');
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Update each quarter
        $updateStmt = $pdo->prepare("
            UPDATE tbl_quarters 
            SET quarter_name = :quarter_name, 
                start_date = :start_date, 
                end_date = :end_date
            WHERE quarter_id = :quarter_id
        ");
        
        $updatedCount = 0;
        foreach ($validatedQuarters as $quarter) {
            $result = $updateStmt->execute([
                ':quarter_id' => $quarter['quarter_id'],
                ':quarter_name' => $quarter['quarter_name'],
                ':start_date' => $quarter['start_date'],
                ':end_date' => $quarter['end_date']
            ]);
            
            if ($result) {
                $updatedCount++;
            } else {
                throw new Exception("Failed to update quarter ID: {$quarter['quarter_id']}");
            }
        }
        
        // Log the update operation
        $logStmt = $pdo->prepare("
            INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
            VALUES (:user_id, :target_user_id, :target_student_id, :action, NOW())
        ");
        
        // For logging purposes, we'll log the overall update
        $logStmt->execute([
            ':user_id' => $input['user_id'] ?? null,
            ':target_user_id' => null,
            ':target_student_id' => null,
            ':action' => 'Updated School Year Timeline'
        ]);
        
        // Commit transaction
        $pdo->commit();
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => "School year timeline updated successfully! {$updatedCount} quarters updated.",
            'data' => [
                'updated_quarters' => $updatedCount,
                'total_duration_days' => $totalDays,
                'total_duration_months' => $totalMonths,
                'quarters' => $validatedQuarters
            ],
            'toast' => [
                'type' => 'success',
                'message' => "School year timeline updated successfully!"
            ]
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    // Database connection or query error
    error_log("Database error in update_school_year_timeline.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred. Please try again.',
        'error' => $e->getMessage(),
        'toast' => [
            'type' => 'error',
            'message' => 'Database error occurred. Please try again.'
        ]
    ]);
    
} catch (Exception $e) {
    // Validation or other error
    error_log("Validation error in update_school_year_timeline.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'toast' => [
            'type' => 'error',
            'message' => $e->getMessage()
        ]
    ]);
    
} finally {
    // Close database connection
    if (isset($pdo)) {
        $pdo = null;
    }
}
?>
