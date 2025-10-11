# Updated Progress Card Notification System

## Overview
This document describes the updated notification system for progress card reports (both quarterly and overall progress) that follows a standardized format for database storage and frontend display.

## Database Storage Format (Third-Person)
All notifications are now stored in the database using a standardized third-person format:

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

## Database Schema

### tbl_notifications Table
```sql
CREATE TABLE `tbl_notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `notif_message` text NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notification_type` enum('General','Parent Activity','Meeting','Reminder') NOT NULL DEFAULT 'General',
  PRIMARY KEY (`notification_id`)
);
```

### tbl_notification_recipients Table
```sql
CREATE TABLE `tbl_notification_recipients` (
  `recipient_id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `recipient_type` enum('Teacher','Parent') NOT NULL,
  `notification_status` enum('Read','Unread') DEFAULT 'Unread',
  PRIMARY KEY (`recipient_id`)
);
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
1. `insert_progress_card.php` - Updated notification creation to use standardized format
2. `update_progress_card.php` - Updated notification creation to use standardized format
3. `insert_overall_progress.php` - Updated notification creation to use standardized format
4. `update_overall_progress.php` - Updated notification creation to use standardized format
5. `get_progress_card_notifications.php` - Updated to format messages for frontend display
6. `get_overall_progress_notifications.php` - Updated to format messages for frontend display
7. `update_existing_notifications.php` - Script to update existing notifications to new format

### Frontend Files
1. `Topbar.js` - Updated to use new notification format (simplified formatting functions)

### Database Files
1. `update_notification_format.sql` - Database migration script
2. `update_notification_recipients.sql` - Database schema update script

## Implementation Details

### Notification Creation Process
When a progress card or overall progress is created/updated:

1. **Check for existing notification**: Look for existing notification for the same student/teacher/quarter combination
2. **Update or Create**: 
   - If exists: Update message to "Updated" format and timestamp
   - If new: Create new notification with "Finalized" format
3. **Store standardized message**: Use third-person format in database
4. **Add recipients**: Add teacher and parent as recipients
5. **Link to progress**: Create entry in `tbl_progress_notification` table

### Frontend Display Process
1. **Fetch notifications**: Get notifications from appropriate API endpoint
2. **Format messages**: Backend formats messages based on user role and perspective
3. **Display**: Frontend displays pre-formatted messages directly

## Migration Process

### Step 1: Run Database Migration
Execute the SQL script to update existing notifications:
```sql
-- Run update_notification_format.sql
```

### Step 2: Run PHP Migration Script
Execute the PHP script to update existing notifications:
```bash
php API/Assessment/update_existing_notifications.php
```

### Step 3: Verify Updates
Check that all notifications have been updated to the new format.

## Benefits of New System

1. **Consistency**: All notifications follow the same format
2. **Maintainability**: Easier to modify notification formats
3. **Performance**: Reduced frontend processing
4. **Scalability**: Better structure for future enhancements
5. **User Experience**: Consistent messaging across all user roles

## Testing

### Test Cases
1. **Teacher creates quarterly progress**: Should create notification with "Finalized" format
2. **Teacher updates quarterly progress**: Should update notification to "Updated" format
3. **Teacher creates overall progress**: Should create notification with "Finalized" format
4. **Teacher updates overall progress**: Should update notification to "Updated" format
5. **Super Admin views**: Should see third-person formatted messages
6. **Teacher views own actions**: Should see first-person formatted messages

### Verification
- Check database for standardized message format
- Verify frontend displays correct messages for each user role
- Ensure notification counts are accurate
- Test notification deduplication logic

## Troubleshooting

### Common Issues
1. **Duplicate notifications**: Check notification creation logic for proper deduplication
2. **Incorrect formatting**: Verify backend formatting functions
3. **Missing notifications**: Check recipient creation logic
4. **Database errors**: Verify table structure and foreign key constraints

### Debug Tools
- Check debug logs in respective PHP files
- Use database queries to verify notification data
- Test API endpoints directly
- Monitor frontend console for errors 