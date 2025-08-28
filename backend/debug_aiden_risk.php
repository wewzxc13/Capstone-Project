<?php
require_once __DIR__ . '/connection.php';

// Debug script to investigate Aiden's risk level issue
echo "<h2>Debugging Aiden's Risk Level Issue</h2>\n";

try {
    // First, let's find Aiden in the database
    $findAiden = $conn->prepare("
        SELECT student_id, stud_firstname, stud_lastname, stud_middlename 
        FROM tbl_students 
        WHERE stud_firstname LIKE '%aiden%' OR stud_firstname LIKE '%Aiden%'
    ");
    $findAiden->execute();
    $aidenStudents = $findAiden->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Found Students with 'Aiden' in name:</h3>\n";
    foreach ($aidenStudents as $student) {
        echo "- ID: {$student['student_id']}, Name: {$student['stud_firstname']} {$student['stud_lastname']} {$student['stud_middlename']}<br>\n";
    }
    
    if (empty($aidenStudents)) {
        echo "<p>No students found with 'Aiden' in the name.</p>\n";
        exit;
    }
    
    // Let's check the first Aiden found
    $aiden = $aidenStudents[0];
    $student_id = $aiden['student_id'];
    
    echo "<h3>Investigating Student ID: {$student_id}</h3>\n";
    
    // Check if Aiden has any advisory assignments
    $advisoryStmt = $conn->prepare("
        SELECT advisory_id, advisory_name 
        FROM tbl_advisory 
        WHERE advisory_id IN (
            SELECT advisory_id 
            FROM tbl_student_advisory 
            WHERE student_id = ?
        )
    ");
    $advisoryStmt->execute([$student_id]);
    $advisories = $advisoryStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h4>Advisory Assignments:</h4>\n";
    if (empty($advisories)) {
        echo "<p>No advisory assignments found for this student.</p>\n";
    } else {
        foreach ($advisories as $advisory) {
            echo "- Advisory ID: {$advisory['advisory_id']}, Name: {$advisory['advisory_name']}<br>\n";
        }
    }
    
    if (!empty($advisories)) {
        $advisory_id = $advisories[0]['advisory_id'];
        
        // Check progress cards
        $progressStmt = $conn->prepare("
            SELECT card_id, quarter_id, is_finalized, risk_id, created_at
            FROM tbl_progress_cards 
            WHERE student_id = ? AND advisory_id = ?
            ORDER BY quarter_id DESC, card_id DESC
        ");
        $progressStmt->execute([$student_id, $advisory_id]);
        $progressCards = $progressStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h4>Progress Cards:</h4>\n";
        if (empty($progressCards)) {
            echo "<p>No progress cards found.</p>\n";
        } else {
            foreach ($progressCards as $card) {
                echo "- Card ID: {$card['card_id']}, Quarter: {$card['quarter_id']}, Finalized: " . 
                     ($card['is_finalized'] ? 'Yes' : 'No') . 
                     ", Risk ID: " . ($card['risk_id'] ?? 'NULL') . 
                     ", Created: {$card['created_at']}<br>\n";
            }
        }
        
        // Check overall progress
        $overallStmt = $conn->prepare("
            SELECT overall_progress_id, risk_id, created_at
            FROM tbl_overall_progress 
            WHERE student_id = ? AND advisory_id = ?
            ORDER BY overall_progress_id DESC
        ");
        $overallStmt->execute([$student_id, $advisory_id]);
        $overallProgress = $overallStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h4>Overall Progress:</h4>\n";
        if (empty($overallProgress)) {
            echo "<p>No overall progress records found.</p>\n";
        } else {
            foreach ($overallProgress as $progress) {
                echo "- Progress ID: {$progress['overall_progress_id']}, Risk ID: " . 
                     ($progress['risk_id'] ?? 'NULL') . 
                     ", Created: {$progress['created_at']}<br>\n";
            }
        }
        
        // Check completed quarters count
        $quartersStmt = $conn->prepare("
            SELECT COUNT(DISTINCT quarter_id) as quarter_count 
            FROM tbl_progress_cards 
            WHERE student_id = ? AND advisory_id = ? AND is_finalized = 1
        ");
        $quartersStmt->execute([$student_id, $advisory_id]);
        $quarterResult = $quartersStmt->fetch(PDO::FETCH_ASSOC);
        $completedQuarters = $quarterResult['quarter_count'] ?? 0;
        
        echo "<h4>Completed Quarters: {$completedQuarters}</h4>\n";
        
        // Now let's simulate the exact logic from get_student_risk_status.php
        echo "<h4>Risk Calculation Logic:</h4>\n";
        
        $risk_id = null;
        $source = null;
        
        if ($completedQuarters >= 4) {
            echo "<p>Student has completed all 4 quarters. Checking overall progress...</p>\n";
            
            $overallStmt = $conn->prepare("
                SELECT risk_id 
                FROM tbl_overall_progress 
                WHERE student_id = ? AND advisory_id = ? 
                ORDER BY overall_progress_id DESC 
                LIMIT 1
            ");
            $overallStmt->execute([$student_id, $advisory_id]);
            $overallResult = $overallStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($overallResult && $overallResult['risk_id']) {
                $risk_id = $overallResult['risk_id'];
                $source = 'overall_progress';
                echo "<p>✅ Found risk_id in overall_progress: {$risk_id}</p>\n";
            } else {
                echo "<p>❌ No risk_id found in overall_progress</p>\n";
            }
        } else {
            echo "<p>Student has NOT completed all 4 quarters. Checking latest progress card...</p>\n";
            
            $cardStmt = $conn->prepare("
                SELECT risk_id 
                FROM tbl_progress_cards 
                WHERE student_id = ? AND advisory_id = ? 
                ORDER BY quarter_id DESC, card_id DESC 
                LIMIT 1
            ");
            $cardStmt->execute([$student_id, $advisory_id]);
            $cardResult = $cardStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($cardResult && $cardResult['risk_id']) {
                $risk_id = $cardResult['risk_id'];
                $source = 'progress_card';
                echo "<p>✅ Found risk_id in progress_card: {$risk_id}</p>\n";
            } else {
                echo "<p>❌ No risk_id found in progress_card</p>\n";
            }
        }
        
        // Get risk name
        $riskName = null;
        if ($risk_id) {
            $riskStmt = $conn->prepare("SELECT risk_name FROM tbl_risk_levels WHERE risk_id = ?");
            $riskStmt->execute([$risk_id]);
            $riskResult = $riskStmt->fetch(PDO::FETCH_ASSOC);
            $riskName = $riskResult ? $riskResult['risk_name'] : null;
        }
        
        echo "<h4>Final Result:</h4>\n";
        echo "<p>Risk ID: " . ($risk_id ?? 'NULL') . "</p>\n";
        echo "<p>Risk Name: " . ($riskName ?? 'NULL') . "</p>\n";
        echo "<p>Source: " . ($source ?? 'NULL') . "</p>\n";
        
        if (!$risk_id) {
            echo "<p style='color: red; font-weight: bold;'>This explains why 'No data' is displayed!</p>\n";
        }
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Database error: " . $e->getMessage() . "</p>\n";
}
?> 