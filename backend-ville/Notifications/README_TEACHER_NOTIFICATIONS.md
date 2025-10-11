# Teacher Notification System

This document describes the new notification system for teachers that implements per-role read tracking for different types of notifications.

## Overview

The teacher notification system separates notifications into three categories, each with its own read tracking mechanism:

1. **General Meetings** → `tbl_notification_recipients` → `is_read` per recipient
2. **One-on-One Meetings** → `tbl_meetings` → per-role flags (`lead_is_read`, `assistant_is_read`)
3. **Progress Notifications** → `tbl_progress_notification` → per-role flags (`lead_is_read`, `assistant_is_read`)

## Database Schema Changes

### 1. tbl_notification_recipients
```sql
ALTER TABLE tbl_notification_recipients
  ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER recipient_type,
  ADD COLUMN read_at DATETIME NULL AFTER is_read,
  ADD KEY idx_notif_user (notification_id, user_id);
```

### 2. tbl_meetings
```sql
ALTER TABLE tbl_meetings
  ADD COLUMN parent_is_read     TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN parent_read_at     DATETIME NULL,
  ADD COLUMN lead_is_read       TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN lead_read_at       DATETIME NULL,
  ADD COLUMN assistant_is_read  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN assistant_read_at  DATETIME NULL;
```

### 3. tbl_progress_notification
```sql
ALTER TABLE tbl_progress_notification
  ADD COLUMN parent_is_read     TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN parent_read_at     DATETIME NULL,
  ADD COLUMN lead_is_read       TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN lead_read_at       DATETIME NULL,
  ADD COLUMN assistant_is_read  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN assistant_read_at  DATETIME NULL;
```

## API Endpoints

### 1. Get Teacher Notifications
**Endpoint:** `POST /backend/Notifications/get_teacher_notifications.php`

**Request Body:**
```json
{
  "user_id": 123,
  "user_role": "Teacher"
}
```

**Response:**
```json
{
  "status": "success",
  "notifications": [
    {
      "notification_id": 1,
      "notif_message": "[MEETING] Created the Meeting",
      "created_at": "2024-01-01 10:00:00",
      "meeting_title": "Staff Meeting",
      "meeting_start": "2024-01-02 09:00:00",
      "meeting_end": "2024-01-02 10:00:00",
      "meeting_status": "Scheduled",
      "is_read": false,
      "read_at": null,
      "notification_type": "general_meeting"
    }
  ],
  "total_count": 1,
  "unread_count": 1,
  "read_count": 0,
  "category_breakdown": {
    "general_meetings": 1,
    "one_on_one_meetings": 0,
    "quarterly_progress": 0,
    "overall_progress": 0
  }
}
```

### 2. Count Teacher Unread Notifications
**Endpoint:** `POST /backend/Notifications/count_teacher_unread.php`

**Request Body:**
```json
{
  "user_id": 123,
  "user_role": "Teacher"
}
```

**Response:**
```json
{
  "status": "success",
  "total_unread": 5,
  "breakdown": {
    "general_meetings": 2,
    "one_on_one_meetings": 1,
    "progress_notifications": 2,
    "quarterly_progress": 1,
    "overall_progress": 1
  }
}
```

### 3. Mark Teacher Notifications as Read
**Endpoint:** `POST /backend/Notifications/mark_teacher_notifications_read.php`

**Request Body:**
```json
{
  "user_id": 123,
  "user_role": "Teacher"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "All notifications marked as read successfully",
  "summary": {
    "marked_as_read": 5,
    "remaining_unread": {
      "general_meetings": 0,
      "one_on_one_meetings": 0,
      "progress_notifications": 0,
      "total": 0
    }
  },
  "breakdown": {
    "general_meetings": 2,
    "one_on_one_meetings": 1,
    "progress_notifications": 2
  }
}
```

## How It Works

### General Meetings
- Notifications are stored in `tbl_notification_recipients`
- Each teacher recipient has their own `is_read` status
- When a teacher opens the notification bell, all their general meeting notifications are marked as read

### One-on-One Meetings
- Read status is stored in `tbl_meetings` with per-role flags
- `lead_is_read` and `assistant_is_read` track read status for each teacher role
- Teachers see notifications based on their advisory role (lead or assistant)

### Progress Notifications
- Read status is stored in `tbl_progress_notification` with per-role flags
- `lead_is_read` and `assistant_is_read` track read status for each teacher role
- Teachers see progress notifications for students in their advisory classes

## Frontend Integration

The frontend has been updated to:

1. Use `fetchTeacherNotifications()` for teachers instead of separate progress APIs
2. Display read status with a green checkmark (✓ Read)
3. Automatically mark all notifications as read when the notification bell is opened
4. Show unread count in the notification bell badge

## Testing

Use the test file `test_teacher_notifications.php` to verify:
- Database schema changes are in place
- Sample data exists
- Queries work correctly

## Future Implementation

This system is designed to be easily extended for parents by:
1. Adding parent-specific APIs
2. Using the existing `parent_is_read` columns
3. Following the same pattern as teachers

## Notes

- Admin/Super Admin continue to use the existing `tbl_notification_admin_views` system
- Teachers get a unified notification experience with proper read tracking
- The system automatically handles different notification types and read status
- All operations are transactional for data consistency
