<?php
include_once 'connection.php';

// Reference date for age computation
$referenceDate = new DateTime('2025-08-04');

// Define valid date ranges for each level
$levelDateRanges = [
    1 => ['start' => '2022-08-05', 'end' => '2023-11-04'],
    2 => ['start' => '2021-08-05', 'end' => '2022-08-04'],
    3 => ['start' => '2020-08-05', 'end' => '2021-08-04'],
];

// Determine level based on age
function getLevelIdFromAge($years, $months) {
    $age = $years + $months / 12;
    if ($age >= 1.8 && $age < 3) {
        return 1;
    } elseif ($age >= 3 && $age < 4) {
        return 2;
    } elseif ($age >= 4 && $age < 5) {
        return 3;
    } else {
        return null;
    }
}

try {
    // Fetch students
    $stmt = $conn->query("SELECT student_id, stud_birthdate FROM tbl_students");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $updated = 0;
    foreach ($students as $student) {
        $studentId = $student['student_id'];
        $birthdate = new DateTime($student['stud_birthdate']);
        $interval = $birthdate->diff($referenceDate);
        $years = $interval->y;
        $months = $interval->m;

        $levelId = getLevelIdFromAge($years, $months);

        if ($levelId !== null) {
            // Make sure birthdate falls inside the valid range
            $range = $levelDateRanges[$levelId];
            if ($birthdate < new DateTime($range['start']) || $birthdate > new DateTime($range['end'])) {
                // Reset to minimum valid date for that level
                $birthdate = new DateTime($range['start']);
            }

            $update = $conn->prepare("UPDATE tbl_students SET level_id = ?, stud_birthdate = ? WHERE student_id = ?");
            $update->execute([$levelId, $birthdate->format('Y-m-d'), $studentId]);
            $updated++;
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Updated level_id and birthdate for $updated students based on age as of August 4, 2025."
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
