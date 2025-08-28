# System Logging for Login/Logout

This document explains how the system logging functionality works for tracking user login and logout events.

## Overview

The system automatically logs user login and logout events to the `tbl_system_logs` table with the following structure:

- **user_id**: The ID of the user who logged in or out
- **target_user_id**: NULL (not applicable for login/logout events)
- **target_student_id**: NULL (not applicable for login/logout events)
- **action**: Either "Login" or "Logout"
- **timestamp**: Current timestamp when the event occurred

## Login/Logout Logic

**Daily Login/Logout Pattern:**
- **Login**: Only one "Login" record per user per day (first login of the day)
- **Logout**: Only one "Logout" record per user per day (after login record exists)
- **Multiple Sessions**: If user logs in multiple times in a day, only the first login is recorded
- **Validation**: Logout can only be recorded if a login record exists for the same day

**Existing Features Preserved:**
- All other logging features remain unchanged (edit, change password, unauthorized, create, archive, restore, etc.)
- The system continues to log all user actions as before
- Only login/logout behavior has been modified for daily tracking

## Implementation Details

### 1. User Display in Topbar

**Location**: `app/Topbar/Topbar.js`

The topbar displays the current user's information:
- **User Name**: Shows the full name of the logged-in user
- **User Role**: Shows the user's role (SuperAdmin, Admin, Teacher, Parent)
- **Profile Menu**: Settings dropdown with Profile Update, Change Password, and Logout options

### 2. Login Logging

**Location**: `API/login.php`

When a user successfully logs in:
- The system checks if a login record already exists for today
- **Only the first login of the day** is recorded (prevents duplicate daily logins)
- If logging fails, the login process continues (logging errors don't block login)
- **Daily Limit**: One login record per user per calendar day

```php
// Log successful login to system logs (only if no login record exists for today)
try {
    // Check if user already has a login record for today
    $checkLoginQuery = $conn->prepare("
        SELECT COUNT(*) as login_count 
        FROM tbl_system_logs 
        WHERE user_id = :user_id 
        AND action = 'Login' 
        AND DATE(timestamp) = CURDATE()
    ");
    $checkLoginQuery->bindParam(":user_id", $user['user_id']);
    $checkLoginQuery->execute();
    $loginResult = $checkLoginQuery->fetch(PDO::FETCH_ASSOC);
    
    // Only insert login record if no login exists for today
    if ($loginResult['login_count'] == 0) {
        $logQuery = $conn->prepare("
            INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
            VALUES (:user_id, NULL, NULL, 'Login', NOW())
        ");
        $logQuery->bindParam(":user_id", $user['user_id']);
        $logQuery->execute();
    }
} catch (Exception $logError) {
    // Don't fail login if logging fails, just log the error
    error_log("Failed to log login: " . $logError->getMessage());
}
```

### 3. Logout Logging

**Location**: `app/Topbar/Topbar.js` and `app/Context/AuthContext.js`

Logout events are logged in multiple scenarios:

#### a) Manual Logout (Topbar)
- When user clicks the logout button in the topbar
- Uses the `handleLogout` function

#### b) AuthContext Logout
- When `auth.logout()` is called from any component
- Ensures consistent logout behavior across the app

#### c) Browser/Tab Closure
- Uses `beforeunload` event listener
- Logs logout when user closes browser or tab
- Uses `navigator.sendBeacon` for reliable logging during page unload

#### d) Tab Switching/Browser Minimization
- Uses `visibilitychange` event listener
- Logs logout when user switches away from the tab or minimizes browser

### 4. API Endpoint

**Location**: `API/Logs/create_system_log.php`

This endpoint handles the actual insertion of log records with validation:

```php
// For logout actions, check if there's already a recent logout record (within 5 minutes)
// AND ensure there's a login record for today before allowing logout
if ($action === 'Logout') {
    // Check for recent logout records (within 5 minutes)
    $checkLogoutQuery = $conn->prepare("
        SELECT COUNT(*) as recent_count 
        FROM tbl_system_logs 
        WHERE user_id = :user_id 
        AND action = 'Logout' 
        AND timestamp > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    ");
    
    // Check if user has a login record for today
    $checkLoginQuery = $conn->prepare("
        SELECT COUNT(*) as login_count 
        FROM tbl_system_logs 
        WHERE user_id = :user_id 
        AND action = 'Login' 
        AND DATE(timestamp) = CURDATE()
    ");
    
    // Only proceed if no recent logout AND login exists for today
}

// Insert the system log record
$query = $conn->prepare("
    INSERT INTO tbl_system_logs (user_id, target_user_id, target_student_id, action, timestamp)
    VALUES (:user_id, NULL, NULL, :action, NOW())
");

$query->bindParam(":user_id", $userId);
$query->bindParam(":action", $action);
```

## Database Schema

The `tbl_system_logs` table structure:

```sql
CREATE TABLE tbl_system_logs (
    log_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    target_user_id INT(11) NULL,
    target_student_id INT(11) NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

**Test Script**: `API/Logs/test_system_log.php`

This script can be run in a browser to test the logging functionality:
- Inserts test login and logout records
- Displays recent logs from the database
- Verifies the logging system is working correctly

## Error Handling

- Login logging failures don't block user authentication
- Logout logging failures don't block the logout process
- All errors are logged to the console for debugging
- The system gracefully continues even if logging fails

## Duplicate Prevention

- **Frontend Protection**: Multiple event listeners (beforeunload, visibilitychange) use session tracking to prevent duplicate logout logs
- **Backend Protection**: API endpoint prevents duplicate logout records within a 5-minute window for the same user
- **Session Tracking**: Uses localStorage flags to track logout state across different event handlers

## Daily Login/Logout Validation

- **Login Validation**: Only one login record per user per calendar day (prevents multiple daily logins)
- **Logout Validation**: Logout can only be recorded if a login record exists for the same day
- **Date-based Logic**: Uses `DATE(timestamp) = CURDATE()` to check for same-day records
- **Graceful Handling**: Failed validation doesn't block user actions, only prevents duplicate logging

## Security Considerations

- Only authenticated users can trigger logout logging
- Input validation ensures only "Login" or "Logout" actions are accepted
- User ID is sanitized before database insertion
- CORS headers are properly configured for localhost development

## Existing Logging Features (Preserved)

The system continues to log all existing user actions exactly as before:

- **User Management**: Create, edit, archive, restore user accounts
- **Password Changes**: All password change attempts
- **Profile Updates**: User profile modifications
- **Student Management**: Student profile operations
- **Security Events**: Unauthorized login attempts, IP tracking
- **System Actions**: All administrative and system-level operations

**Important**: Only the login/logout behavior has been modified. All other logging features remain unchanged and fully functional.

## Usage Examples

### View Recent Login/Logout Logs

```sql
SELECT * FROM tbl_system_logs 
WHERE action IN ('Login', 'Logout') 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Count Logins by User

```sql
SELECT user_id, COUNT(*) as login_count 
FROM tbl_system_logs 
WHERE action = 'Login' 
GROUP BY user_id;
```

### Find User Session Duration

```sql
SELECT 
    l1.user_id,
    l1.timestamp as login_time,
    l2.timestamp as logout_time,
    TIMESTAMPDIFF(MINUTE, l1.timestamp, l2.timestamp) as session_minutes
FROM tbl_system_logs l1
JOIN tbl_system_logs l2 ON l1.user_id = l2.user_id
WHERE l1.action = 'Login' 
AND l2.action = 'Logout'
AND l2.timestamp > l1.timestamp
ORDER BY l1.timestamp DESC;
```

### Check Daily Login Status

```sql
-- Check if a user has logged in today
SELECT 
    user_id,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Logged in today'
        ELSE 'Not logged in today'
    END as today_status
FROM tbl_system_logs 
WHERE user_id = 1 
AND action = 'Login' 
AND DATE(timestamp) = CURDATE()
GROUP BY user_id;

-- List all users who logged in today
SELECT DISTINCT user_id, timestamp
FROM tbl_system_logs 
WHERE action = 'Login' 
AND DATE(timestamp) = CURDATE()
ORDER BY timestamp DESC;
``` 