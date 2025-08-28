-- Notification System Database Schema Setup
-- Run this script to add the required columns for read/unread functionality

-- 1. Add columns to tbl_notification_recipients for general meetings (Teacher/Parent only)
ALTER TABLE tbl_notification_recipients
  ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER recipient_type,
  ADD COLUMN read_at DATETIME NULL AFTER is_read,
  ADD KEY idx_notif_user (notification_id, user_id);

-- 2. Add columns to tbl_meetings for one-on-one meetings (per-role flags for Teacher/Parent only)
ALTER TABLE tbl_meetings
  ADD COLUMN parent_is_read     TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN parent_read_at     DATETIME NULL,
  ADD COLUMN lead_is_read       TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN lead_read_at       DATETIME NULL,
  ADD COLUMN assistant_is_read  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN assistant_read_at  DATETIME NULL;

-- 3. Add columns to tbl_progress_notification for progress notifications (per-role flags for Teacher/Parent only)
ALTER TABLE tbl_progress_notification
  ADD COLUMN parent_is_read     TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN parent_read_at     DATETIME NULL,
  ADD COLUMN lead_is_read       TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN lead_read_at       DATETIME NULL,
  ADD COLUMN assistant_is_read  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN assistant_read_at  DATETIME NULL;

-- 4. Create the new Admin/Super Admin "seen" tracking table
CREATE TABLE IF NOT EXISTS tbl_notification_admin_views (
  user_id         INT NOT NULL,
  notification_id INT NOT NULL,
  viewed_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notification_id),
  KEY idx_user_time (user_id, viewed_at),
  CONSTRAINT fk_nav_user FOREIGN KEY (user_id) REFERENCES tbl_users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_nav_notif FOREIGN KEY (notification_id) REFERENCES tbl_notifications(notification_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Create indexes for better performance
CREATE INDEX idx_meetings_lead_teacher ON tbl_meetings(advisory_id, lead_is_read);
CREATE INDEX idx_meetings_assistant_teacher ON tbl_meetings(advisory_id, assistant_is_read);
CREATE INDEX idx_meetings_parent ON tbl_meetings(parent_id, parent_is_read);

CREATE INDEX idx_progress_lead_teacher ON tbl_progress_notification(student_id, lead_is_read);
CREATE INDEX idx_progress_assistant_teacher ON tbl_progress_notification(student_id, assistant_is_read);
CREATE INDEX idx_progress_parent ON tbl_progress_notification(student_id, parent_is_read);

-- 6. Verify the changes
SELECT 
    'tbl_notification_recipients' as table_name,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tbl_notification_recipients'
    AND COLUMN_NAME IN ('is_read', 'read_at')
ORDER BY COLUMN_NAME;

SELECT 
    'tbl_meetings' as table_name,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tbl_meetings'
    AND COLUMN_NAME IN ('parent_is_read', 'parent_read_at', 'lead_is_read', 'lead_read_at', 'assistant_is_read', 'assistant_read_at')
ORDER BY COLUMN_NAME;

SELECT 
    'tbl_progress_notification' as table_name,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tbl_progress_notification'
    AND COLUMN_NAME IN ('parent_is_read', 'parent_read_at', 'lead_is_read', 'lead_read_at', 'assistant_is_read', 'assistant_read_at')
ORDER BY COLUMN_NAME;

-- 7. Verify the new admin views table
SELECT 
    'tbl_notification_admin_views' as table_name,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tbl_notification_admin_views'
ORDER BY COLUMN_NAME;

-- 8. Sample queries to test the new functionality

-- Count unseen notifications for Admin/Super Admin
-- SELECT COUNT(*) AS unseen_for_admin
-- FROM tbl_notifications n
-- LEFT JOIN tbl_notification_admin_views v
--   ON v.notification_id = n.notification_id
--  AND v.user_id = ?
-- WHERE v.notification_id IS NULL;

-- Count unseen general meetings for Admin
-- SELECT COUNT(*) AS unseen_general
-- FROM tbl_notifications n
-- JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
-- LEFT JOIN tbl_notification_admin_views v
--   ON v.notification_id = n.notification_id AND v.user_id = ?
-- WHERE v.notification_id IS NULL
--   AND m.parent_id IS NULL AND m.student_id IS NULL AND m.advisory_id IS NULL;

-- Count unseen one-on-one meetings for Admin
-- SELECT COUNT(*) AS unseen_one_on_one
-- FROM tbl_notifications n
-- JOIN tbl_meetings m ON m.meeting_id = n.meeting_id
-- LEFT JOIN tbl_notification_admin_views v
--   ON v.notification_id = n.notification_id AND v.user_id = ?
-- WHERE v.notification_id IS NULL
--   AND (m.parent_id IS NOT NULL OR m.advisory_id IS NOT NULL);

-- Count unseen progress notifications for Admin
-- SELECT COUNT(*) AS unseen_progress
-- FROM tbl_notifications n
-- LEFT JOIN tbl_notification_admin_views v
--   ON v.notification_id = n.notification_id AND v.user_id = ?
-- WHERE v.notification_id IS NULL
--   AND n.meeting_id IS NULL;

-- Mark notification as seen by Admin
-- INSERT INTO tbl_notification_admin_views (user_id, notification_id)
-- VALUES (?, ?)
-- ON DUPLICATE KEY UPDATE viewed_at = NOW();
