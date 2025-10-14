<?php
// CORS headers are handled in connection.php which supports production domains
include_once __DIR__ . '/../connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Only GET requests are allowed']);
    exit;
}

try {
    // Get all class levels
    $stmt = $conn->prepare('SELECT level_id, level_name FROM tbl_student_levels');
    $stmt->execute();
    $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $scheduleResult = [];
    foreach ($levels as $level) {
        $level_id = $level['level_id'];
        $level_name = $level['level_name'];
        // Get schedule for this level
        $stmtSched = $conn->prepare('
            SELECT s.schedule_id, s.day_of_week, s.start_minutes, s.end_minutes, s.minutes, s.schedule_item_id,
                   si.item_type, si.subject_id, si.subject_id_2, si.routine_id, si.routine_id_2,
                   sub.subject_name, sub2.subject_name AS subject_name_2,
                   r.routine_name, r2.routine_name AS routine_name_2
            FROM tbl_schedule s
            JOIN tbl_schedule_items si ON s.schedule_item_id = si.schedule_item_id
            LEFT JOIN tbl_subjects sub ON si.subject_id = sub.subject_id
            LEFT JOIN tbl_subjects sub2 ON si.subject_id_2 = sub2.subject_id
            LEFT JOIN tbl_routines r ON si.routine_id = r.routine_id
            LEFT JOIN tbl_routines r2 ON si.routine_id_2 = r2.routine_id
            WHERE s.level_id = ?
            ORDER BY FIELD(s.day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"), s.start_minutes
        ');
        $stmtSched->execute([$level_id]);
        $schedules = $stmtSched->fetchAll(PDO::FETCH_ASSOC);
        // Group by day
        $byDay = [];
        foreach ($schedules as $sched) {
            // Robustly set type and ids
            if (
                $sched['item_type'] === '1' || 
                ($sched['subject_name'] && !$sched['routine_id']) || 
                ($sched['subject_id'] && !$sched['routine_id'])
            ) {
                $itemType = 'subject';
                $itemName = $sched['subject_name'];
                $subject_id = $sched['subject_id'];
                $routine_id = null;
            } else {
                $itemType = 'routine';
                $itemName = $sched['routine_name'];
                $subject_id = null;
                $routine_id = $sched['routine_id'];
            }
            // Convert minutes to time string
            $startTime = minutesToTime($sched['start_minutes']);
            $endTime = minutesToTime($sched['end_minutes']);
            $byDay[$sched['day_of_week']][] = [
                'schedule_id' => $sched['schedule_id'],
                'schedule_item_id' => $sched['schedule_item_id'],
                'start_time' => $startTime,
                'end_time' => $endTime,
                'start_minutes' => $sched['start_minutes'],
                'end_minutes' => $sched['end_minutes'],
                'type' => $itemType,
                'name' => $itemName,
                'subject' => $sched['subject_name'] ?? null,
                'subject_id' => $subject_id,
                'subject_id_2' => $sched['subject_id_2'] ?? null,
                'subject_name_2' => $sched['subject_name_2'] ?? null,
                'routine_id' => $routine_id,
                'routine_id_2' => $sched['routine_id_2'] ?? null,
                'routine_name' => $sched['routine_name'] ?? null,
                'routine_name_2' => $sched['routine_name_2'] ?? null,
                'minutes' => $sched['minutes']
            ];
        }
        $scheduleResult[] = [
            'level_id' => $level_id,
            'level_name' => $level_name,
            'schedule' => $byDay
        ];
    }
    echo json_encode(['status' => 'success', 'schedules' => $scheduleResult]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}

// Helper function to convert minutes to time string
function minutesToTime($minutes) {
    // Assuming school starts at 8:00 AM (480 minutes from midnight)
    // If minutes are less than 480, assume they're school hours starting from 8 AM
    if ($minutes < 480) {
        $minutes += 480; // Add 8 hours to convert to school time
    }
    
    $hours = floor($minutes / 60);
    $mins = $minutes % 60;
    $ampm = $hours >= 12 ? 'PM' : 'AM';
    $hours12 = $hours % 12;
    if ($hours12 == 0) $hours12 = 12;
    return sprintf("%d:%02d %s", $hours12, $mins, $ampm);
} 