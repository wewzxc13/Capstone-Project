<?php
// Start output buffering to prevent stray output from breaking JSON
ob_start();
header('Content-Type: application/json; charset=utf-8');
// Use shared PDO connection
include_once '../connection.php';

// Ensure PHP notices/warnings don't break JSON output
@ini_set('display_errors', '0');
@error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$response = [
    'success' => false,
    'data' => [],
    'error' => null,
];

try {
    // If connection failed in connection.php
    if (!isset($conn) || !($conn instanceof PDO)) {
        throw new Exception(isset($connection_error) ? $connection_error : 'Database connection not available');
    }

    // Get the logged-in user ID from the request
    $loggedInUserId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    
    if ($loggedInUserId <= 0) {
        throw new Exception('Missing user_id parameter');
    }
    
    // Check if this is a search request (to get all users) or conversation history request
    $isSearchRequest = isset($_GET['search']) && $_GET['search'] === 'true';
    
    if ($isSearchRequest) {
        // SEARCH MODE: Return all active users for search suggestions, excluding those with only archived conversations
        $sql = "SELECT DISTINCT
                    u.user_id,
                    u.user_role,
                    u.user_firstname,
                    u.user_middlename,
                    u.user_lastname,
                    u.user_email,
                    u.user_status,
                    u.user_photo,
                    u.created_at,
                    r.role_name,
                    NULL as last_sent_at,
                    NULL as last_message,
                    NULL as unread_count
                FROM tbl_users u
                LEFT JOIN tbl_roles r ON u.user_role = r.role_id
                WHERE u.user_role IN (1,2,3,4) 
                    AND TRIM(LOWER(u.user_status)) = 'active'
                    AND u.user_id != :logged_in_user_id
                    AND (
                        -- User has no conversations at all (include them)
                        NOT EXISTS (
                            SELECT 1 FROM tbl_communication c
                            WHERE (c.sender_id = :logged_in_user_id AND c.receiver_id = u.user_id)
                               OR (c.sender_id = u.user_id AND c.receiver_id = :logged_in_user_id)
                        )
                        OR
                        -- User has at least one non-archived conversation (include them)
                        EXISTS (
                            SELECT 1 FROM tbl_communication c
                            WHERE ((c.sender_id = :logged_in_user_id AND c.receiver_id = u.user_id)
                                   OR (c.sender_id = u.user_id AND c.receiver_id = :logged_in_user_id))
                              AND c.is_archived = 0
                        )
                    )
                ORDER BY r.role_id, u.user_lastname ASC, u.user_firstname ASC";
    } else {
        // CONVERSATION HISTORY MODE: Return only users with conversation history
        $sql = "SELECT DISTINCT
                    u.user_id,
                    u.user_role,
                    u.user_firstname,
                    u.user_middlename,
                    u.user_lastname,
                    u.user_email,
                    u.user_status,
                    u.user_photo,
                    u.created_at,
                    ls.last_sent_at,
                    r.role_name,
                    ls.last_message,
                    ls.is_last_unsent,
                    COALESCE(unread.unread_count, 0) as unread_count
                FROM tbl_users u
                LEFT JOIN tbl_roles r ON u.user_role = r.role_id
                LEFT JOIN (
                    SELECT 
                        conversation_partner_id,
                        last_sent_at,
                        last_message,
                        is_last_unsent
                    FROM (
                        SELECT 
                            CASE 
                                WHEN c.sender_id = :logged_in_user_id THEN c.receiver_id 
                                ELSE c.sender_id 
                            END AS conversation_partner_id,
                            c.sent_at AS last_sent_at,
                            CASE 
                                WHEN c.is_unsent = 1 THEN
                                    CASE 
                                        WHEN c.sender_id = :logged_in_user_id THEN 'You unsent a message'
                                        ELSE CONCAT(
                                            (SELECT CONCAT(user_firstname, ' ', user_lastname) 
                                             FROM tbl_users 
                                             WHERE user_id = c.sender_id
                                             LIMIT 1), 
                                            ' unsent a message'
                                        )
                                    END
                                WHEN c.sender_id = :logged_in_user_id THEN CONCAT('You: ', c.message_text)
                                ELSE c.message_text
                            END as last_message,
                            c.is_unsent as is_last_unsent,
                            ROW_NUMBER() OVER (
                                PARTITION BY CASE 
                                    WHEN c.sender_id = :logged_in_user_id THEN c.receiver_id 
                                    ELSE c.sender_id 
                                END 
                                ORDER BY c.sent_at DESC
                            ) as rn
                        FROM tbl_communication c
                        WHERE (c.sender_id = :logged_in_user_id OR c.receiver_id = :logged_in_user_id)
                            AND c.is_archived = 0
                    ) ranked
                    WHERE rn = 1
                ) ls ON ls.conversation_partner_id = u.user_id
                LEFT JOIN (
                    SELECT 
                        CASE 
                            WHEN c.sender_id = :logged_in_user_id THEN c.receiver_id 
                            ELSE c.sender_id 
                        END AS conversation_partner_id,
                        COUNT(CASE WHEN c.is_read = 0 AND c.sender_id != :logged_in_user_id THEN 1 END) as unread_count
                    FROM tbl_communication c
                    WHERE (c.sender_id = :logged_in_user_id OR c.receiver_id = :logged_in_user_id)
                        AND c.is_archived = 0
                    GROUP BY CASE 
                        WHEN c.sender_id = :logged_in_user_id THEN c.receiver_id 
                        ELSE c.sender_id 
                    END
                ) unread ON unread.conversation_partner_id = u.user_id
                WHERE u.user_role IN (1,2,3,4) 
                    AND TRIM(LOWER(u.user_status)) = 'active'
                    AND u.user_id != :logged_in_user_id
                    AND ls.conversation_partner_id IS NOT NULL
                ORDER BY ls.last_sent_at DESC, u.user_lastname ASC, u.user_firstname ASC";
    }

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':logged_in_user_id', $loggedInUserId, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Debug: Log the raw data being returned
    error_log("get_users.php - Raw SQL results for user $loggedInUserId: " . json_encode($rows));

    // Process each user photo to return filename only (frontend prefixes /php/Uploads/)
    foreach ($rows as &$row) {
        if (!empty($row['user_photo'])) {
            // If full URL or path slipped in, normalize to filename
            $parts = explode('/', (string)$row['user_photo']);
            $row['user_photo'] = end($parts);
        } else {
            // Provide default filename based on role
            if ($row['role_name'] === 'Admin') {
                $row['user_photo'] = 'default_admin.png';
            } else if ($row['role_name'] === 'Teacher') {
                $row['user_photo'] = 'default_teacher.png';
            } else if ($row['role_name'] === 'Parent') {
                $row['user_photo'] = 'default_parent.png';
            } else {
                $row['user_photo'] = 'default_owner.png';
            }
        }
    }

    // Debug: Log the processed data
    error_log("get_users.php - Processed data for user $loggedInUserId: " . json_encode($rows));

    $response['success'] = true;
    $response['data'] = $rows;
    $response['mode'] = $isSearchRequest ? 'search' : 'conversations';
    
    // Clean any previous output and return JSON only
    if (ob_get_length()) { ob_clean(); }
    $json = json_encode($response);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
} catch (Throwable $e) {
    if (ob_get_length()) { ob_clean(); }
    http_response_code(500);
    $response['error'] = 'Server error: ' . $e->getMessage();
    $json = json_encode($response);
    header('Content-Length: ' . strlen($json));
    echo $json;
    exit;
}
?>

