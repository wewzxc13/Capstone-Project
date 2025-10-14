<?php
// CORS headers are handled in connection.php which supports production domains
include_once '../connection.php';

try {
    // Get all advisories with a level_id
    $stmt = $conn->prepare("SELECT advisory_id, level_id FROM tbl_advisory WHERE level_id IS NOT NULL");
    $stmt->execute();
    $advisories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($advisories as $advisory) {
        $advisory_id = $advisory['advisory_id'];
        $level_id = $advisory['level_id'];

        // Only students with parent_id and parent_profile_id not null
        $stmt2 = $conn->prepare("SELECT student_id, stud_gender FROM tbl_students WHERE level_id = ? AND stud_school_status = 'Active' AND parent_id IS NOT NULL AND parent_profile_id IS NOT NULL");
        $stmt2->execute([$level_id]);
        $students = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        // Remove existing assignments for this advisory
        $conn->prepare("DELETE FROM tbl_student_assigned WHERE advisory_id = ?")->execute([$advisory_id]);

        $male = 0;
        $female = 0;

        // Assign students and count gender
        foreach ($students as $stud) {
            $conn->prepare("INSERT INTO tbl_student_assigned (advisory_id, student_id) VALUES (?, ?)")->execute([$advisory_id, $stud['student_id']]);
            if (strtolower($stud['stud_gender']) === 'male') $male++;
            if (strtolower($stud['stud_gender']) === 'female') $female++;
        }

        // Update gender counts
        $conn->prepare("UPDATE tbl_advisory SET total_male = ?, total_female = ? WHERE advisory_id = ?")->execute([$male, $female, $advisory_id]);

        foreach ($students as &$student) {
            $student['advisory_id'] = $advisory_id;
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'Students auto-assigned and gender counts updated.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'error' => $e->getMessage()]);
} 