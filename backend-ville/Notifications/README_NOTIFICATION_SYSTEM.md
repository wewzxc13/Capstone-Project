# Notification System - Backend Scripts

This folder contains the backend scripts for implementing the notification read/unread functionality using a clean, data-integrity-focused approach.

## 🎯 **New Approach: Admin Views Table**

**Key Principle:** Admin and Super Admin never modify recipient read status. Instead, they use a separate tracking table.

### **Database Structure:**

1. **Recipient Read Status** (Teacher/Parent only):
   - `tbl_notification_recipients.is_read` - General meetings
   - `tbl_meetings.*_is_read` - One-on-one meetings (per role)
   - `tbl_progress_notification.*_is_read` - Progress notifications (per role)

2. **Admin Seen Tracking** (Super Admin only):
   - `tbl_notification_admin_views` - Tracks what Super Admin has seen

## Database Schema Requirements

### 1. Recipient Read Status Tables (Teacher/Parent only)

```sql
-- General meetings
ALTER TABLE tbl_notification_recipients
  ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER recipient_type,
  ADD COLUMN read_at DATETIME NULL AFTER is_read,
  ADD KEY idx_notif_user (notification_id, user_id);

-- One-on-one meetings
ALTER TABLE tbl_meetings
  ADD COLUMN parent_is_read     TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN parent_read_at     DATETIME NULL,
  ADD COLUMN lead_is_read       TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN lead_read_at       DATETIME NULL,
  ADD COLUMN assistant_is_read  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN assistant_read_at  DATETIME NULL;

-- Progress notifications
ALTER TABLE tbl_progress_notification
  ADD COLUMN parent_is_read     TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN parent_read_at     DATETIME NULL,
  ADD COLUMN lead_is_read       TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN lead_read_at       DATETIME NULL,
  ADD COLUMN assistant_is_read  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN assistant_read_at  DATETIME NULL;
```

### 2. Admin Seen Tracking Table (Super Admin only)

```sql
CREATE TABLE IF NOT EXISTS tbl_notification_admin_views (
  user_id         INT NOT NULL,
  notification_id INT NOT NULL,
  viewed_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notification_id),
  KEY idx_user_time (user_id, viewed_at),
  CONSTRAINT fk_nav_user FOREIGN KEY (user_id) REFERENCES tbl_users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_nav_notif FOREIGN KEY (notification_id) REFERENCES tbl_notifications(notification_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## Available Scripts

### 1. count_unread_notifications.php
Counts unseen notifications for Super Admin using admin views table.

**Method:** POST  
**Parameters:**
- `user_id` (required): The ID of the user
- `user_role` (required): User's role

**Super Admin Behavior:**
- Counts notifications not in `tbl_notification_admin_views`
- Categorizes by: general meetings, one-on-one meetings, progress notifications
- Never modifies recipient read status

**Response:**
```json
{
  "status": "success",
  "total_unread": 15,
  "breakdown": {
    "general_meetings": 8,
    "one_on_one_meetings": 4,
    "progress_notifications": 3
  }
}
```

### 2. mark_all_notifications_read.php
Marks all notifications as seen for Super Admin (when clicking notification bell).

**Method:** POST  
**Parameters:**
- `user_id` (required): The ID of the user
- `user_role` (required): User's role

**Super Admin Behavior:**
- Inserts all unseen notifications into `tbl_notification_admin_views`
- Returns summary of marked notifications
- Never modifies recipient read status

**Response:**
```json
{
  "status": "success",
  "message": "All notifications marked as seen successfully",
  "summary": {
    "marked_as_seen": 15,
    "remaining_unseen": {
      "general_meetings": 0,
      "one_on_one_meetings": 0,
      "progress_notifications": 0,
      "total": 0
    }
  }
}
```

### 3. mark_notification_read.php
Marks individual notifications as seen for Super Admin.

**Method:** POST  
**Parameters:**
- `user_id` (required): The ID of the user
- `notification_type` (required): Type of notification
- `notification_id` (required): The ID of the notification
- `user_role` (optional): User's role

**Super Admin Behavior:**
- Inserts notification into `tbl_notification_admin_views`
- Never modifies recipient read status

**Response:**
```json
{
  "status": "success",
  "message": "Notification marked as seen successfully"
}
```

### 4. mark_notification_seen.php (NEW)
Dedicated script for marking notifications as seen by Super Admin.

**Method:** POST  
**Parameters:**
- `user_id` (required): The ID of the user
- `notification_id` (required): The ID of the notification
- `user_role` (required): User's role

**Response:**
```json
{
  "status": "success",
  "message": "Notification marked as seen successfully",
  "unseen_count": 14
}
```

### 5. get_notifications_with_read_status.php
Gets all notifications with seen status for Super Admin.

**Method:** POST  
**Parameters:**
- `user_id` (required): The ID of the user
- `user_role` (required): User's role

**Super Admin Behavior:**
- Shows ALL notifications with admin seen status
- Categorizes by type (general meeting, one-on-one meeting, progress notification)
- Never modifies recipient read status

**Response:**
```json
{
  "status": "success",
  "notifications": [
    {
      "type": "general_meeting",
      "category": "General Meeting",
      "notification_id": "123",
      "is_read": true,
      "read_status": "seen_by_admin",
      "admin_viewed_at": "2024-01-01 10:00:00",
      "notif_message": "Meeting created",
      "created_at": "2024-01-01 10:00:00"
    }
  ],
  "total_count": 25,
  "unseen_count": 15,
  "seen_count": 10,
  "category_breakdown": {
    "general_meetings": 8,
    "one_on_one_meetings": 12,
    "progress_notifications": 5
  }
}
```

## Current Implementation Status

### ✅ Super Admin
- **View Access:** All notification types
- **Seen Tracking:** Uses `tbl_notification_admin_views` table
- **Data Integrity:** Never modifies recipient read status
- **Badge Count:** Based on unseen notifications

### 🔄 Teacher (Coming Soon)
- Will support one-on-one meetings and progress notifications
- Role-based read status tracking for their advisory classes

### 🔄 Parent (Coming Soon)
- Will support meetings and progress notifications for their children
- Role-based read status tracking for their children's notifications

## Frontend Integration

### **For Super Admin:**

1. **Display notification count**: Call `count_unread_notifications.php`
2. **User clicks notification bell**: Call `mark_all_notifications_read.php`
3. **User opens individual notification**: Call `mark_notification_seen.php`
4. **Show notifications list**: Call `get_notifications_with_read_status.php`

### **Key Benefits:**

- **Clean separation** between recipient read status and admin seen tracking
- **Data integrity** - recipient read status remains untouched
- **Flexible tracking** - Super Admin can track what they've seen without affecting others
- **Scalable** - easy to add more admin users later

## Database Queries

### **Count unseen notifications for Super Admin:**
```sql
SELECT COUNT(*) AS unseen_for_admin
FROM tbl_notifications n
LEFT JOIN tbl_notification_admin_views v
  ON v.notification_id = n.notification_id AND v.user_id = ?
WHERE v.notification_id IS NULL;
```

### **Mark notification as seen by Super Admin:**
```sql
INSERT INTO tbl_notification_admin_views (user_id, notification_id)
VALUES (?, ?)
ON DUPLICATE KEY UPDATE viewed_at = NOW();
```

### **Get notifications with seen status:**
```sql
SELECT n.*, m.*, (v.notification_id IS NOT NULL) AS admin_seen, v.viewed_at
FROM tbl_notifications n
LEFT JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
LEFT JOIN tbl_notification_admin_views v
  ON v.notification_id = n.notification_id AND v.user_id = ?
ORDER BY n.created_at DESC;
```

## Error Handling

All scripts return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Technical error details (if available)"
}
```

## Security Notes

- All scripts validate required parameters
- User role is checked for appropriate access
- SQL injection protection via prepared statements
- Transaction support for data consistency
- Super Admin can only mark notifications as seen, never modify recipient status

## Testing

Test the scripts with:

```bash
# Count unseen notifications (Super Admin)
curl -X POST /php/Notifications/count_unread_notifications.php \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1", "user_role": "SuperAdmin"}'

# Mark all notifications as seen (Super Admin)
curl -X POST /php/Notifications/mark_all_notifications_read.php \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1", "user_role": "SuperAdmin"}'

# Mark individual notification as seen (Super Admin)
curl -X POST /php/Notifications/mark_notification_seen.php \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1", "notification_id": "1", "user_role": "SuperAdmin"}'
```

## Summary of New Approach

**The system now properly separates concerns:**

1. **Recipient Read Status:** Managed by Teachers/Parents only
2. **Admin Seen Tracking:** Managed by Super Admin only
3. **Data Integrity:** Recipient read status remains untouched
4. **Clean Architecture:** Separate tables for separate purposes

**Result:** Super Admin can track what they've seen without interfering with Teacher/Parent read status, maintaining data integrity while providing full visibility.
