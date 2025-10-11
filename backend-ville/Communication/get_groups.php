<?php
// Start output buffering FIRST to catch any errors
ob_start();

// Suppress all error display (errors will be logged instead)
@ini_set('display_errors', '0');
@ini_set('display_startup_errors', '0');
@ini_set('html_errors', '0');
@error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../connection.php';

$viewerId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0; // optional; enables per-user labels and unread counts

try {
    // Validate user_id is provided
    if ($viewerId === 0) {
        if (ob_get_length()) { ob_clean(); }
        http_response_code(400);
        $json = json_encode(['success' => false, 'error' => 'User ID is required']);
        header('Content-Length: ' . strlen($json));
        echo $json;
        exit;
    }
    
    // Get user role first to determine group access
    $userRoleStmt = $conn->prepare("SELECT user_role FROM tbl_users WHERE user_id = ? LIMIT 1");
    $userRoleStmt->execute([$viewerId]);
    $userRole = $userRoleStmt->fetchColumn();
    
    if (!$userRole) {
        if (ob_get_length()) { ob_clean(); }
        http_response_code(404);
        $json = json_encode(['success' => false, 'error' => 'User not found']);
        header('Content-Length: ' . strlen($json));
        echo $json;
        exit;
    }
    
    // Build query based on user role
    $sql = "SELECT DISTINCT g.group_id, g.group_type, g.group_name, g.group_ref_id 
            FROM tbl_comm_group g
            WHERE 1=1";
    
    $params = [];
    
    if ($userRole == 1 || $userRole == 2) {
        // Super Admin (1) and Admin (2) - can see all groups
        $sql .= " ORDER BY g.group_id ASC";
    } elseif ($userRole == 3) {
        // Teacher (3) - can see General, Staff, and assigned classes
        $sql .= " AND (g.group_type IN ('Overall', 'Staff') OR 
                       g.group_ref_id IN (
                           SELECT DISTINCT advisory_id 
                           FROM tbl_advisory 
                           WHERE lead_teacher_id = ? OR assistant_teacher_id = ?
                       ))";
        $sql .= " ORDER BY g.group_id ASC";
        $params[] = $viewerId;
        $params[] = $viewerId;
    } elseif ($userRole == 4) {
        // Parent (4) - can see General and classes their child is assigned to
        $sql .= " AND (g.group_type = 'Overall' OR 
                       g.group_ref_id IN (
                           SELECT DISTINCT sa.advisory_id 
                           FROM tbl_student_assigned sa
                           JOIN tbl_students s ON sa.student_id = s.student_id
                           WHERE s.parent_id = ?
                       ))";
        $sql .= " ORDER BY g.group_id ASC";
        $params[] = $viewerId;
    } else {
        // Unknown role - no access
        $sql .= " AND 1=0";
    }
    
    $stmt = $conn->prepare($sql);
    foreach ($params as $i => $param) {
        $stmt->bindValue($i + 1, $param, PDO::PARAM_INT);
    }
    $stmt->execute();
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug logging (can be removed in production)
    error_log("User ID: $viewerId, Role: $userRole, Groups found: " . count($groups));

    $result = [];

    // Preload role counts for labels (optional but cheap)
    $roleCounts = ['1' => 0, '2' => 0, '3' => 0, '4' => 0];
    try {
        $rc = $conn->query("SELECT user_role, COUNT(*) c FROM tbl_users WHERE user_status = 'Active' GROUP BY user_role")->fetchAll(PDO::FETCH_KEY_PAIR);
        foreach ($rc as $r => $c) { $roleCounts[(string)$r] = (int)$c; }
    } catch (Throwable $e) { /* label will fallback */ }

    foreach ($groups as $g) {
        $groupId = (int)$g['group_id'];
        $groupType = $g['group_type'];
        $participantsLabel = '';

        if ($groupType === 'Overall') {
            $participantsLabel = 'Owners, Admins, Teachers, Parents';
        } elseif ($groupType === 'Staff') {
            $participantsLabel = 'Owners, Admins, Teachers';
        } elseif ($groupType === 'Class') {
            // Build label from advisory teachers and number of parents
            $leadName = null;
            $assistantName = null;
            $parentsCount = 0;
            if (!empty($g['group_ref_id'])) {
                // Teacher names
                $t = $conn->prepare("SELECT lead_teacher_id, assistant_teacher_id FROM tbl_advisory WHERE advisory_id = ? LIMIT 1");
                $t->execute([$g['group_ref_id']]);
                if ($row = $t->fetch(PDO::FETCH_ASSOC)) {
                    if (!empty($row['lead_teacher_id'])) {
                        $q = $conn->prepare("SELECT user_firstname, user_middlename, user_lastname FROM tbl_users WHERE user_id = ?");
                        $q->execute([$row['lead_teacher_id']]);
                        if ($u = $q->fetch(PDO::FETCH_ASSOC)) {
                            $leadName = trim(preg_replace('/\s+/', ' ', $u['user_firstname'].' '.($u['user_middlename'] ?? '').' '.$u['user_lastname']));
                        }
                    }
                    if (!empty($row['assistant_teacher_id'])) {
                        $q = $conn->prepare("SELECT user_firstname, user_middlename, user_lastname FROM tbl_users WHERE user_id = ?");
                        $q->execute([$row['assistant_teacher_id']]);
                        if ($u = $q->fetch(PDO::FETCH_ASSOC)) {
                            $assistantName = trim(preg_replace('/\s+/', ' ', $u['user_firstname'].' '.($u['user_middlename'] ?? '').' '.$u['user_lastname']));
                        }
                    }
                }
                // Parents count (unique)
                $pc = $conn->prepare("SELECT COUNT(DISTINCT s.parent_id) AS c
                    FROM tbl_student_assigned sa
                    JOIN tbl_students s ON sa.student_id = s.student_id
                    WHERE sa.advisory_id = ? AND s.parent_id IS NOT NULL");
                $pc->execute([$g['group_ref_id']]);
                $parentsCount = (int)($pc->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);
            }

            if ($leadName && $assistantName) {
                $participantsLabel = "Advisers: {$leadName} & {$assistantName} • Parents ({$parentsCount})";
            } elseif ($leadName) {
                $participantsLabel = "Adviser: {$leadName} • Parents ({$parentsCount})";
            } else {
                $participantsLabel = "Parents ({$parentsCount})";
            }
        }

        // Last message (include unsent label with sender name; if viewerId provided, personalize)
        $lastMessage = null;
        $lastSentAt = null;
        $lm = $conn->prepare("SELECT message_text, sent_at, is_unsent, sender_id FROM tbl_comm_group_message WHERE group_id = ? ORDER BY sent_at DESC, group_message_id DESC LIMIT 1");
        $lm->execute([$groupId]);
        if ($row = $lm->fetch(PDO::FETCH_ASSOC)) {
            $lastSentAt = $row['sent_at'];
            $lastSenderId = (int)$row['sender_id'];
            // lookup sender role and display name for preview formatting
            $senderRole = null; $senderDisplay = 'Member';
            try {
                $uq = $conn->prepare("SELECT user_role, user_firstname, user_middlename, user_lastname FROM tbl_users WHERE user_id = ? LIMIT 1");
                $uq->execute([$lastSenderId]);
                if ($usr = $uq->fetch(PDO::FETCH_ASSOC)) {
                    $senderRole = (int)$usr['user_role'];
                    $senderDisplay = trim(preg_replace('/\\s+/', ' ', $usr['user_firstname'].' '.($usr['user_middlename'] ?? '').' '.$usr['user_lastname']));
                }
            } catch (Throwable $e) { /* ignore */ }
            if (($row['is_unsent'] ?? 0) == 1) {
                if ($viewerId > 0 && $lastSenderId === $viewerId) {
                    $lastMessage = 'You unsent a message';
                } else {
                    $lastMessage = $senderDisplay . ' unsent a message';
                }
            } else {
                if ($viewerId > 0 && $lastSenderId === $viewerId) {
                    $lastMessage = 'You: ' . $row['message_text'];
                } else {
                    $lastMessage = $row['message_text'];
                }
            }
        }

        // Unread count for this viewer: messages in this group that do not have a read row
        $unreadCount = 0;
        if ($viewerId > 0) {
            $uq = $conn->prepare("SELECT COUNT(*) AS c
                                   FROM tbl_comm_group_message gm
                                   LEFT JOIN tbl_comm_group_read gr
                                     ON gr.group_message_id = gm.group_message_id
                                    AND gr.user_id = ?
                                   WHERE gm.group_id = ?
                                     AND gm.sender_id <> ?
                                     AND (gr.group_message_id IS NULL)");
            $uq->execute([$viewerId, $groupId, $viewerId]);
            $unreadCount = (int)($uq->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);
        }

        $result[] = [
            'group_id' => $groupId,
            'group_type' => $groupType,
            'group_name' => $g['group_name'],
            'group_ref_id' => $g['group_ref_id'],
            'participants_label' => $participantsLabel,
            'last_message' => $lastMessage,
            'last_sent_at' => $lastSentAt,
            'unread_count' => $unreadCount,
            'last_sender_id' => isset($lastSenderId) ? $lastSenderId : null,
            'last_sender_role' => isset($senderRole) ? $senderRole : null,
            'last_sender_name' => isset($senderDisplay) ? $senderDisplay : null,
            'last_is_unsent' => isset($row['is_unsent']) ? (int)$row['is_unsent'] : null,
        ];
    }

    // Clean output buffer and send JSON response
    if (ob_get_length()) { ob_clean(); }
    $json = json_encode(['success' => true, 'data' => $result]);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
} catch (PDOException $e) {
    if (ob_get_length()) { ob_clean(); }
    http_response_code(500);
    $json = json_encode(['success' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
} catch (Exception $e) {
    if (ob_get_length()) { ob_clean(); }
    http_response_code(500);
    $json = json_encode(['success' => false, 'error' => $e->getMessage()]);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
} catch (Throwable $e) {
    if (ob_get_length()) { ob_clean(); }
    http_response_code(500);
    $json = json_encode(['success' => false, 'error' => 'Unexpected error occurred']);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
}