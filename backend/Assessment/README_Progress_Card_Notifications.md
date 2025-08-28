# Progress Card Notification System

## Overview
This document describes the updated notification system for progress card reports (both quarterly and overall progress) that follows a standardized format for database storage and frontend display.

## Database Storage Format (Third-Person)
All notifications are stored in the database using a standardized third-person format:

### Quarterly Progress
- **INSERT**: `[QUARTERLY PROGRESS] Finalized a Quarterly Progress`
- **UPDATE**: `[QUARTERLY PROGRESS] Updated a Quarterly Progress`

### Overall Progress
- **INSERT**: `[OVERALL PROGRESS] Finalized an Overall progress`
- **UPDATE**: `[OVERALL PROGRESS] Updated an Overall progress`

## Frontend Display Logic

### Super Admin Viewing
- **Quarterly Progress**: `[QUARTERLY PROGRESS] Progress card for {student_fullname} has been finalized for {quarter_name} by {teacher_name}.`
- **Overall Progress**: `[OVERALL PROGRESS] Overall progress for {student_fullname} has been finalized by {teacher_name}.`

### Teacher Viewing Their Own Actions
- **Quarterly Progress**: `[QUARTERLY PROGRESS] You finalized the progress card for {student_name} for {quarter_name}.`
- **Overall Progress**: `[OVERALL PROGRESS] You finalized the overall progress for {student_name}.`

## Database Schema Changes

### tbl_notification_recipients Table
Added `student_id` field to link notifications to specific students:

```sql
ALTER TABLE `tbl_notification_recipients` 
ADD COLUMN `student_id` int(11) NULL AFTER `user_id`;
```

### tbl_progress_notification Table
This table serves as a linking table that connects notifications to specific students and quarters:

```sql
CREATE TABLE `tbl_progress_notification` (
  `progress_notif_id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_id` int(11) NOT NULL,
  `quarter_id` int(11) NULL,
  `student_id` int(11) NOT NULL,
  PRIMARY KEY (`progress_notif_id`),
  KEY `notification_id` (`notification_id`),
  KEY `quarter_id` (`quarter_id`),
  KEY `student_id` (`student_id`)
);
```

**Usage:**
- For quarterly progress: `quarter_id` contains the quarter number (1, 2, 3, 4)
- For overall progress: `quarter_id` is NULL (since it's not quarter-specific)
- `student_id` links to the specific student
- `notification_id` links to the main notification record

## API Endpoints

### 1. Progress Card Notifications
- **File**: `get_progress_card_notifications.php`
- **Method**: POST
- **Parameters**: 
  - `user_id`: The user's ID
  - `user_role`: The user's role (Super Admin, Teacher)
- **Returns**: Formatted notifications based on user role

### 2. Overall Progress Notifications
- **File**: `get_overall_progress_notifications.php`
- **Method**: POST
- **Parameters**: 
  - `user_id`: The user's ID
  - `user_role`: The user's role (Super Admin, Teacher)
- **Returns**: Formatted notifications based on user role

## Updated Files

### Backend Files
1. `insert_progress_card.php` - Updated notification creation
2. `update_progress_card.php` - Updated notification creation
3. `insert_overall_progress.php` - Updated notification creation
4. `update_overall_progress.php` - Updated notification creation
5. `get_progress_card_notifications.php` - New API endpoint
6. `get_overall_progress_notifications.php` - New API endpoint

### Frontend Files
1. `Topbar.js` - Updated to use new notification format

### Database Files
1. `update_notification_recipients.sql` - Database schema update script

## Implementation Details

### Notification Creation
When a progress card or overall progress is created/updated:
1. Check if notification already exists for the same student/teacher combination
2. If exists, update timestamp; otherwise create new notification
3. Store notification in third-person format
4. Add recipients (teacher and parent) with student_id reference
5. Insert record into `tbl_progress_notification` linking notification to student and quarter

### Notification Retrieval
1. Query notifications based on user role
2. Join with `tbl_progress_notification` to get quarter and student information
3. Join with student and teacher tables to get names
4. Format messages based on viewer role and ownership
5. Return formatted notifications for frontend display

## Usage Examples

### Creating a Progress Card Notification
```php
// Database storage format
$notificationMessage = "[QUARTERLY PROGRESS] Finalized a Quarterly Progress";

// Frontend display (Super Admin)
"[QUARTERLY PROGRESS] Progress card for Jamica Placido has been finalized for 1st Quarter by Jessa Decena."

// Frontend display (Teacher)
"[QUARTERLY PROGRESS] You finalized the progress card for Jamica Placido for 1st Quarter."
```

### Creating an Overall Progress Notification
```php
// Database storage format
$notificationMessage = "[OVERALL PROGRESS] Finalized an Overall progress";

// Frontend display (Super Admin)
"[OVERALL PROGRESS] Overall progress for Jamica Placido has been finalized by Jessa Decena."

// Frontend display (Teacher)
"[OVERALL PROGRESS] You finalized the overall progress for Jamica Placido."
```

## Notes
- The system maintains backward compatibility with existing notifications
- Notifications are automatically formatted based on the viewer's role
- Student names are retrieved from the database using the student_id reference
- Teacher names are retrieved from the database using the created_by reference 