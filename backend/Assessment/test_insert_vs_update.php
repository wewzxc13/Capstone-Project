<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

// Test parameters - change these as needed
$student_id = 1; // Change to test with different student
$advisory_id = 1; // Change to test with different advisory

echo "=== TESTING INSERT vs UPDATE BEHAVIOR ===\n";
echo "Student ID: $student_id\n";
echo "Advisory ID: $advisory_id\n\n";

try {
    // 1. Check if subject overall progress records exist
    echo "=== CHECKING EXISTING RECORDS ===\n";
    $checkStmt = $conn->prepare('SELECT COUNT(*) as cnt FROM tbl_subject_overall_progress WHERE student_id = ? AND advisory_id = ?');
    $checkStmt->execute([$student_id, $advisory_id]);
    $checkRow = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $existingCount = intval($checkRow['cnt']);
    
    echo "Existing subject overall progress records: $existingCount\n\n";
    
    if ($existingCount > 0) {
        echo "✅ Records exist - should use UPDATE script\n";
        echo "Testing UPDATE script...\n";
        
        // Test the update script
        $updateData = [
            'student_id' => $student_id,
            'advisory_id' => $advisory_id
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'http://localhost/capstone-project/backend/Assessment/update_subject_overall_progress.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "UPDATE Response (HTTP $httpCode):\n";
        echo $response . "\n\n";
        
        // Check if records were updated (not deleted/inserted)
        $checkStmt2 = $conn->prepare('SELECT COUNT(*) as cnt FROM tbl_subject_overall_progress WHERE student_id = ? AND advisory_id = ?');
        $checkStmt2->execute([$student_id, $advisory_id]);
        $checkRow2 = $checkStmt2->fetch(PDO::FETCH_ASSOC);
        $newCount = intval($checkRow2['cnt']);
        
        echo "Records after UPDATE: $newCount\n";
        if ($newCount === $existingCount) {
            echo "✅ SUCCESS: Records were updated, not deleted/inserted\n";
        } else {
            echo "❌ FAIL: Record count changed - records were deleted/inserted instead of updated\n";
        }
        
    } else {
        echo "❌ No records exist - should use INSERT script\n";
        echo "Testing INSERT script...\n";
        
        // Test the insert script
        $insertData = [
            'student_id' => $student_id,
            'advisory_id' => $advisory_id
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'http://localhost/capstone-project/backend/Assessment/insert_subject_overall_progress.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($insertData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "INSERT Response (HTTP $httpCode):\n";
        echo $response . "\n\n";
        
        // Check if new records were created
        $checkStmt3 = $conn->prepare('SELECT COUNT(*) as cnt FROM tbl_subject_overall_progress WHERE student_id = ? AND advisory_id = ?');
        $checkStmt3->execute([$student_id, $advisory_id]);
        $checkRow3 = $checkStmt3->fetch(PDO::FETCH_ASSOC);
        $finalCount = intval($checkRow3['cnt']);
        
        echo "Records after INSERT: $finalCount\n";
        if ($finalCount > 0) {
            echo "✅ SUCCESS: New records were inserted\n";
        } else {
            echo "❌ FAIL: No records were inserted\n";
        }
    }
    
    // 2. Show current records
    echo "\n=== CURRENT RECORDS ===\n";
    $stmt = $conn->prepare('
        SELECT sop.*, s.subject_name
        FROM tbl_subject_overall_progress sop
        JOIN tbl_subjects s ON sop.subject_id = s.subject_id
        WHERE sop.student_id = ? AND sop.advisory_id = ?
        ORDER BY s.subject_name
    ');
    $stmt->execute([$student_id, $advisory_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($rows)) {
        echo "No records found.\n";
    } else {
        foreach ($rows as $row) {
            echo "- {$row['subject_name']}: Score {$row['finalsubj_avg_score']}%\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
