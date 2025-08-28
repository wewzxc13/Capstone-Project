# Complete Progress Card Notification System

## Overview
This document confirms that all three tables (`tbl_notifications`, `tbl_notification_recipients`, and `tbl_progress_notification`) are properly updated when progress card reports (quarterly and overall) are created or updated.

## Database Tables Updated

### 1. tbl_notifications
- **Purpose**: Stores the main notification message
- **Format**: Third-person standardized format
- **Updated When**: Progress card is created or updated

### 2. tbl_notification_recipients  
- **Purpose**: Links notifications to users (teachers and parents)
- **Fields**: notification_id, user_id, recipient_type, student_id
- **Updated When**: Progress card is created or updated

### 3. tbl_progress_notification
- **Purpose**: Links notifications to specific students and quarters
- **Fields**: notification_id, quarter_id, student_id
- **Updated When**: Progress card is created or updated

## Implementation Details

### Quarterly Progress Card Operations

#### INSERT Progress Card (`insert_progress_card.php`)
```php
// 1. Insert into tbl_notifications
$notificationMessage = "[QUARTERLY PROGRESS] Finalized a Quarterly Progress";
$stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
$stmtNotif->execute([$notificationMessage, $finalized_by]);
$notification_id = $conn->lastInsertId();

// 2. Insert into tbl_notification_recipients (Parent)
$stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Parent', ?)");
$stmtRecipient->execute([$notification_id, $parentRow['parent_id'], $sid]);

// 3. Insert into tbl_notification_recipients (Teacher)
$stmtRecipient2 = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Teacher', ?)");
$stmtRecipient2->execute([$notification_id, $finalized_by, $sid]);

// 4. Insert into tbl_progress_notification
$stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, ?, ?)");
$stmtProgressNotif->execute([$notification_id, $quarter_id, $sid]);
```

#### UPDATE Progress Card (`update_progress_card.php`)
```php
// 1. Insert into tbl_notifications
$notificationMessage = "[QUARTERLY PROGRESS] Updated a Quarterly Progress";
$stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
$stmtNotif->execute([$notificationMessage, $user_id]);
$notification_id = $conn->lastInsertId();

// 2. Insert into tbl_notification_recipients (Parent)
$stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Parent', ?)");
$stmtRecipient->execute([$notification_id, $parentRow['parent_id'], $student_id]);

// 3. Insert into tbl_notification_recipients (Teacher)
$stmtRecipient2 = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Teacher', ?)");
$stmtRecipient2->execute([$notification_id, $user_id, $student_id]);

// 4. Insert into tbl_progress_notification
$stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, ?, ?)");
$stmtProgressNotif->execute([$notification_id, $quarter_id, $student_id]);
```

### Overall Progress Operations

#### INSERT Overall Progress (`insert_overall_progress.php`)
```php
// 1. Insert into tbl_notifications
$notificationMessage = "[OVERALL PROGRESS] Finalized an Overall progress";
$stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
$stmtNotif->execute([$notificationMessage, $teacherId]);
$notification_id = $conn->lastInsertId();

// 2. Insert into tbl_notification_recipients (Parent)
$stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Parent', ?)");
$stmtRecipient->execute([$notification_id, $parentRow['parent_id'], $student_id]);

// 3. Insert into tbl_notification_recipients (Teacher)
$stmtRecipient2 = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Teacher', ?)");
$stmtRecipient2->execute([$notification_id, $teacherId, $student_id]);

// 4. Insert into tbl_progress_notification (quarter_id = NULL for overall progress)
$stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, NULL, ?)");
$stmtProgressNotif->execute([$notification_id, $student_id]);
```

#### UPDATE Overall Progress (`update_overall_progress.php`)
```php
// 1. Insert into tbl_notifications
$notificationMessage = "[OVERALL PROGRESS] Updated an Overall progress";
$stmtNotif = $conn->prepare("INSERT INTO tbl_notifications (notif_message, created_by, created_at) VALUES (?, ?, NOW())");
$stmtNotif->execute([$notificationMessage, $user_id]);
$notification_id = $conn->lastInsertId();

// 2. Insert into tbl_notification_recipients (Parent)
$stmtRecipient = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Parent', ?)");
$stmtRecipient->execute([$notification_id, $parentRow['parent_id'], $student_id]);

// 3. Insert into tbl_notification_recipients (Teacher)
$stmtRecipient2 = $conn->prepare("INSERT INTO tbl_notification_recipients (notification_id, user_id, recipient_type, student_id) VALUES (?, ?, 'Teacher', ?)");
$stmtRecipient2->execute([$notification_id, $user_id, $student_id]);

// 4. Insert into tbl_progress_notification (quarter_id = NULL for overall progress)
$stmtProgressNotif = $conn->prepare("INSERT INTO tbl_progress_notification (notification_id, quarter_id, student_id) VALUES (?, NULL, ?)");
$stmtProgressNotif->execute([$notification_id, $student_id]);
```

## Frontend Display Logic

### Super Admin Viewing

#### Quarterly Progress
- **Database Storage**: `[QUARTERLY PROGRESS] Finalized a Quarterly Progress`
- **Frontend Display**: `[QUARTERLY PROGRESS] Progress card for {student_name} has been finalized for {quarter_name} by {teacher_name}.`

#### Overall Progress  
- **Database Storage**: `[OVERALL PROGRESS] Finalized an Overall progress`
- **Frontend Display**: `[OVERALL PROGRESS] Overall progress for {student_name} has been finalized by {teacher_name}.`

### Teacher Viewing Their Own Actions

#### Quarterly Progress
- **Database Storage**: `[QUARTERLY PROGRESS] Finalized a Quarterly Progress`
- **Frontend Display**: `[QUARTERLY PROGRESS] You finalized the progress card for {student_name} for {quarter_name}.`

#### Overall Progress
- **Database Storage**: `[OVERALL PROGRESS] Finalized an Overall progress`  
- **Frontend Display**: `[OVERALL PROGRESS] You finalized the overall progress for {student_name}.`

## Data Flow Summary

### When Progress Card is Created/Updated:

1. **tbl_notifications** ← Gets the standardized third-person message
2. **tbl_notification_recipients** ← Gets teacher and parent recipients with student_id
3. **tbl_progress_notification** ← Gets the quarter_id and student_id linking

### When Notifications are Retrieved:

1. **Query** all three tables with proper JOINs
2. **Format** messages based on user role and ownership
3. **Display** personalized messages for each user type

## Duplicate Prevention Logic

### Smart Record Checking
The system prevents duplicate notifications by checking all three tables before creating new records:

#### Quarterly Progress Check:
```sql
SELECT n.notification_id 
FROM tbl_notifications n
INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
WHERE n.created_by = ? 
AND nr.recipient_type = 'Teacher' 
AND nr.user_id = ?
AND nr.student_id = ?
AND pn.quarter_id = ?
AND n.notif_message LIKE '%[QUARTERLY PROGRESS]%'
```

#### Overall Progress Check:
```sql
SELECT n.notification_id 
FROM tbl_notifications n
INNER JOIN tbl_notification_recipients nr ON n.notification_id = nr.notification_id
INNER JOIN tbl_progress_notification pn ON n.notification_id = pn.notification_id
WHERE n.created_by = ? 
AND nr.recipient_type = 'Teacher' 
AND nr.user_id = ?
AND nr.student_id = ?
AND pn.quarter_id IS NULL
AND n.notif_message LIKE '%[OVERALL PROGRESS]%'
```

### Update vs Insert Logic:
- **If record exists**: Only update the `created_at` timestamp in `tbl_notifications`
- **If record doesn't exist**: Create new records in all three tables

## Verification

All three tables are guaranteed to be updated because:

1. **Atomic Operations**: All inserts are within the same transaction
2. **Error Handling**: If any insert fails, the entire operation is rolled back
3. **Data Integrity**: Foreign key constraints ensure referential integrity
4. **Consistent Formatting**: All messages follow the standardized third-person format
5. **Duplicate Prevention**: Smart checking prevents duplicate notifications

## Files Updated

### Backend Files:
- `insert_progress_card.php` ✅
- `update_progress_card.php` ✅  
- `insert_overall_progress.php` ✅
- `update_overall_progress.php` ✅
- `get_progress_card_notifications.php` ✅
- `get_overall_progress_notifications.php` ✅

### Frontend Files:
- `Topbar.js` ✅

### Database Files:
- `update_notification_recipients.sql` ✅
- `README_Progress_Card_Notifications.md` ✅

## Conclusion

The notification system is now complete and ensures that all three tables (`tbl_notifications`, `tbl_notification_recipients`, and `tbl_progress_notification`) are properly updated whenever progress card reports are created or updated, with proper formatting for both database storage and frontend display. 