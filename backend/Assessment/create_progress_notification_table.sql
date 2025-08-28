-- Create tbl_progress_notification table if it doesn't exist
CREATE TABLE IF NOT EXISTS `tbl_progress_notification` (
  `progress_notif_id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_id` int(11) NOT NULL,
  `quarter_id` int(11) NULL,
  `student_id` int(11) NOT NULL,
  PRIMARY KEY (`progress_notif_id`),
  KEY `notification_id` (`notification_id`),
  KEY `quarter_id` (`quarter_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `fk_progress_notification_notification_id` 
    FOREIGN KEY (`notification_id`) REFERENCES `tbl_notifications`(`notification_id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_progress_notification_student_id` 
    FOREIGN KEY (`student_id`) REFERENCES `tbl_students`(`student_id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add student_id column to tbl_notification_recipients if it doesn't exist
ALTER TABLE `tbl_notification_recipients` 
ADD COLUMN IF NOT EXISTS `student_id` int(11) NULL AFTER `user_id`;

-- Add index for student_id if it doesn't exist
CREATE INDEX IF NOT EXISTS `idx_notification_recipients_student_id` 
ON `tbl_notification_recipients` (`student_id`);

-- Add foreign key constraint if it doesn't exist
ALTER TABLE `tbl_notification_recipients` 
ADD CONSTRAINT IF NOT EXISTS `fk_notification_recipients_student_id` 
FOREIGN KEY (`student_id`) REFERENCES `tbl_students`(`student_id`) 
ON DELETE SET NULL ON UPDATE CASCADE; 