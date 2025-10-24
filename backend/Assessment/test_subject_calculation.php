<?php
require_once __DIR__ . '/../connection.php';
header('Content-Type: application/json');

// Test parameters - change these as needed
$student_id = 1; // Change to test with different student
$advisory_id = 1; // Change to test with different advisory

echo "=== TESTING SUBJECT CALCULATION ===\n";
echo "Student ID: $student_id\n";
echo "Advisory ID: $advisory_id\n\n";

try {
    // 1. Check progress cards
    $stmt = $conn->prepare('SELECT COUNT(*) as cnt FROM tbl_progress_cards WHERE student_id = ? AND advisory_id = ? AND quarter_id IN (1,2,3,4)');
    $stmt->execute([$student_id, $advisory_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Progress cards count: " . ($row['cnt'] ?? 0) . "\n";
    
    if (!$row || intval($row['cnt']) < 4) {
        echo "❌ Not all 4 quarters have progress cards. Cannot proceed.\n";
        exit;
    }
    
    // 2. Get all subjects from BOTH quarter feedback AND schedule (including subject_id_2) - NEW COMPREHENSIVE APPROACH
    echo "\n=== NEW COMPREHENSIVE APPROACH: Getting subjects from BOTH quarter feedback AND schedule ===\n";
    $stmt = $conn->prepare('
        SELECT DISTINCT s.subject_id, s.subject_name 
        FROM tbl_subjects s 
        WHERE s.subject_id IN (
            -- Subjects with quarter feedback
            SELECT DISTINCT qf.subject_id 
            FROM tbl_quarter_feedback qf 
            WHERE qf.student_id = ?
            
            UNION
            
            -- Subjects from schedule (including subject_id_2)
            SELECT DISTINCT si.subject_id 
            FROM tbl_schedule sch 
            JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id 
            WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
            AND si.subject_id IS NOT NULL
            
            UNION
            
            SELECT DISTINCT si.subject_id_2 
            FROM tbl_schedule sch 
            JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id 
            WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
            AND si.subject_id_2 IS NOT NULL
        )
        ORDER BY s.subject_name
    ');
    $stmt->execute([$student_id, $advisory_id, $advisory_id]);
    $subjectRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Subjects found with comprehensive approach: " . count($subjectRows) . "\n";
    foreach ($subjectRows as $subject) {
        echo "- {$subject['subject_name']} (ID: {$subject['subject_id']})\n";
    }
    
    // 3. Get all quarter feedback for these subjects
    $subjects = array_column($subjectRows, 'subject_id');
    $in = implode(',', array_fill(0, count($subjects), '?'));
    $params = array_merge([$student_id], $subjects);
    $sql = "SELECT subject_id, quarter_id, visual_feedback_id FROM tbl_quarter_feedback WHERE student_id = ? AND subject_id IN ($in) AND quarter_id IN (1,2,3,4) ORDER BY subject_id, quarter_id";
    $stmt2 = $conn->prepare($sql);
    $stmt2->execute($params);
    $feedbacks = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nQuarter feedback found: " . count($feedbacks) . " records\n";
    
    // 4. Check which subjects have complete feedback for all 4 quarters
    $subjectQuarterCounts = [];
    foreach ($feedbacks as $fb) {
        $subject_id = $fb['subject_id'];
        if (!isset($subjectQuarterCounts[$subject_id])) {
            $subjectQuarterCounts[$subject_id] = [];
        }
        $subjectQuarterCounts[$subject_id][] = $fb['quarter_id'];
    }
    
    echo "\n=== SUBJECT QUARTER ANALYSIS ===\n";
    $completeSubjects = [];
    foreach ($subjectQuarterCounts as $subject_id => $quarters) {
        $subjectName = '';
        foreach ($subjectRows as $sr) {
            if ($sr['subject_id'] == $subject_id) {
                $subjectName = $sr['subject_name'];
                break;
            }
        }
        
        $uniqueQuarters = array_unique($quarters);
        $quarterList = implode(', ', $uniqueQuarters);
        $status = count($uniqueQuarters) >= 4 ? "✅ COMPLETE" : "❌ INCOMPLETE";
        
        echo "$subjectName (ID: $subject_id): Quarters [$quarterList] - $status\n";
        
        if (count($uniqueQuarters) >= 4) {
            $completeSubjects[] = $subject_id;
        }
    }
    
    echo "\n=== FINAL RESULT ===\n";
    echo "Subjects with complete feedback for all 4 quarters: " . count($completeSubjects) . "\n";
    foreach ($completeSubjects as $subject_id) {
        $subjectName = '';
        foreach ($subjectRows as $sr) {
            if ($sr['subject_id'] == $subject_id) {
                $subjectName = $sr['subject_name'];
                break;
            }
        }
        echo "- $subjectName\n";
    }
    
    // 5. OLD APPROACH for comparison (UPDATED to include subject_id_2)
    echo "\n=== OLD APPROACH: Getting subjects from schedule (UPDATED) ===\n";
    $stmt = $conn->prepare('
        SELECT DISTINCT s.subject_id, s.subject_name 
        FROM tbl_schedule sch 
        JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id 
        JOIN tbl_subjects s ON (
            si.subject_id = s.subject_id OR 
            si.subject_id_2 = s.subject_id
        )
        WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
        ORDER BY s.subject_name
    ');
    $stmt->execute([$advisory_id]);
    $oldSubjectRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Subjects found from schedule (including dual subjects): " . count($oldSubjectRows) . "\n";
    foreach ($oldSubjectRows as $subject) {
        echo "- {$subject['subject_name']} (ID: {$subject['subject_id']})\n";
    }
    
    // 6. Show detailed schedule structure
    echo "\n=== DETAILED SCHEDULE STRUCTURE ===\n";
    $stmt = $conn->prepare('
        SELECT 
            s.day_of_week,
            s.start_minutes,
            s.end_minutes,
            s.minutes,
            si.item_type,
            si.subject_id,
            si.subject_id_2,
            sub1.subject_name as subject_name_1,
            sub2.subject_name as subject_name_2,
            si.routine_id,
            si.routine_id_2,
            r1.routine_name as routine_name_1,
            r2.routine_name as routine_name_2
        FROM tbl_schedule s
        JOIN tbl_schedule_items si ON s.schedule_item_id = si.schedule_item_id
        LEFT JOIN tbl_subjects sub1 ON si.subject_id = sub1.subject_id
        LEFT JOIN tbl_subjects sub2 ON si.subject_id_2 = sub2.subject_id
        LEFT JOIN tbl_routines r1 ON si.routine_id = r1.routine_id
        LEFT JOIN tbl_routines r2 ON si.routine_id_2 = r2.routine_id
        WHERE s.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
        ORDER BY FIELD(s.day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"), s.start_minutes
    ');
    $stmt->execute([$advisory_id]);
    $scheduleDetails = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Schedule items for this advisory:\n";
    foreach ($scheduleDetails as $item) {
        $timeRange = sprintf("%02d:%02d-%02d:%02d", 
            intval($item['start_minutes']/60), 
            $item['start_minutes']%60,
            intval($item['end_minutes']/60), 
            $item['end_minutes']%60
        );
        
        echo "  {$item['day_of_week']} {$timeRange} ({$item['minutes']}min): ";
        
        if ($item['item_type'] == 1) { // Subject
            if ($item['subject_name_1']) {
                echo "Subject: {$item['subject_name_1']} (ID: {$item['subject_id']})";
            }
            if ($item['subject_name_2']) {
                echo " + {$item['subject_name_2']} (ID: {$item['subject_id_2']})";
            }
        } else { // Routine
            if ($item['routine_name_1']) {
                echo "Routine: {$item['routine_name_1']} (ID: {$item['routine_id']})";
            }
            if ($item['routine_name_2']) {
                echo " + {$item['routine_name_2']} (ID: {$item['routine_id_2']})";
            }
        }
        echo "\n";
    }
    
    // 7. Compare approaches
    $newSubjectIds = array_column($subjectRows, 'subject_id');
    $oldSubjectIds = array_column($oldSubjectRows, 'subject_id');
    
    $onlyInNew = array_diff($newSubjectIds, $oldSubjectIds);
    $onlyInOld = array_diff($oldSubjectIds, $newSubjectIds);
    
    echo "\n=== COMPARISON ===\n";
    if (!empty($onlyInNew)) {
        echo "Subjects ONLY in comprehensive approach:\n";
        foreach ($onlyInNew as $subject_id) {
            $subjectName = '';
            foreach ($subjectRows as $sr) {
                if ($sr['subject_id'] == $subject_id) {
                    $subjectName = $sr['subject_name'];
                    break;
                }
            }
            echo "- $subjectName (ID: $subject_id)\n";
        }
    }
    
    if (!empty($onlyInOld)) {
        echo "Subjects ONLY in schedule approach:\n";
        foreach ($onlyInOld as $subject_id) {
            $subjectName = '';
            foreach ($oldSubjectRows as $sr) {
                if ($sr['subject_id'] == $subject_id) {
                    $subjectName = $sr['subject_name'];
                    break;
                }
            }
            echo "- $subjectName (ID: $subject_id)\n";
        }
    }
    
    if (empty($onlyInNew) && empty($onlyInOld)) {
        echo "Both approaches return the same subjects.\n";
    }
    
    // 8. Check what subjects are missing from quarter feedback
    echo "\n=== MISSING SUBJECTS ANALYSIS ===\n";
    $scheduledSubjectIds = array_column($oldSubjectRows, 'subject_id');
    $missingFromFeedback = array_diff($scheduledSubjectIds, $newSubjectIds);
    
    if (!empty($missingFromFeedback)) {
        echo "Subjects scheduled but NO quarter feedback found:\n";
        foreach ($missingFromFeedback as $subject_id) {
            $subjectName = '';
            foreach ($oldSubjectRows as $sr) {
                if ($sr['subject_id'] == $subject_id) {
                    $subjectName = $sr['subject_name'];
                    break;
                }
            }
            echo "- $subjectName (ID: $subject_id) - This subject is scheduled but has no assessment data\n";
        }
        echo "\nThis explains why these subjects aren't in the final calculation!\n";
    } else {
        echo "All scheduled subjects have quarter feedback data.\n";
    }
    
    // 9. Show the comprehensive approach breakdown
    echo "\n=== COMPREHENSIVE APPROACH BREAKDOWN ===\n";
    
    // Get subjects from quarter feedback only
    $stmt = $conn->prepare('
        SELECT DISTINCT s.subject_id, s.subject_name 
        FROM tbl_subjects s 
        JOIN tbl_quarter_feedback qf ON s.subject_id = qf.subject_id 
        WHERE qf.student_id = ?
        ORDER BY s.subject_name
    ');
    $stmt->execute([$student_id]);
    $quarterFeedbackSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get subjects from schedule only (including subject_id_2)
    $stmt = $conn->prepare('
        SELECT DISTINCT s.subject_id, s.subject_name 
        FROM tbl_schedule sch 
        JOIN tbl_schedule_items si ON sch.schedule_item_id = si.schedule_item_id 
        JOIN tbl_subjects s ON (
            si.subject_id = s.subject_id OR 
            si.subject_id_2 = s.subject_id
        )
        WHERE sch.level_id = (SELECT level_id FROM tbl_advisory WHERE advisory_id = ?)
        ORDER BY s.subject_name
    ');
    $stmt->execute([$advisory_id]);
    $scheduleSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Subjects from quarter feedback: " . count($quarterFeedbackSubjects) . "\n";
    foreach ($quarterFeedbackSubjects as $subject) {
        echo "  - {$subject['subject_name']} (ID: {$subject['subject_id']})\n";
    }
    
    echo "\nSubjects from schedule (including subject_id_2): " . count($scheduleSubjects) . "\n";
    foreach ($scheduleSubjects as $subject) {
        echo "  - {$subject['subject_name']} (ID: {$subject['subject_id']})\n";
    }
    
    echo "\nTotal unique subjects (comprehensive): " . count($subjectRows) . "\n";
    echo "This comprehensive approach ensures ALL subjects are captured!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
