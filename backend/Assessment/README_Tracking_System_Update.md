# Tracking System Update - Separate Level Tables

## Overview

The tracking system has been updated to use separate tables for each class level instead of a single `tbl_tracking` table. This change improves performance and data organization by separating records by class level.

## Class Level Mapping

- **Level 1 (Discoverer)**: `tbl_tracking_discoverer`
- **Level 2 (Explorer)**: `tbl_tracking_explorer`  
- **Level 3 (Adventurer)**: `tbl_tracking_adventurer`

## Database Structure

Each tracking table has the same structure:
```sql
CREATE TABLE tbl_tracking_[level] (
    tracking_id INT(11) AUTO_INCREMENT PRIMARY KEY,
    student_id INT(11) NOT NULL,
    activity_id INT(11) NOT NULL,
    visual_feedback_id INT(11) NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Files Updated

### Core Files
1. **`tracking_helper.php`** - New helper functions for tracking operations
2. **`add_activity.php`** - Updated to insert into appropriate level table
3. **`save_rating.php`** - Updated to save ratings to appropriate level table
4. **`get_assessment_table.php`** - Updated to fetch from all level tables
5. **`update_quarter_feedback.php`** - Updated to use appropriate level table
6. **`get_quarter_feedback.php`** - Updated to fetch from all level tables

### Helper Functions

The `tracking_helper.php` file provides these functions:

- `getTrackingTableName($level_id)` - Get table name for a level
- `getStudentLevelId($conn, $student_id)` - Get student's level_id
- `insertTrackingRecord($conn, $student_id, $activity_id, $visual_feedback_id)` - Insert tracking record
- `updateTrackingRecord($conn, $student_id, $activity_id, $visual_feedback_id)` - Update tracking record
- `trackingRecordExists($conn, $student_id, $activity_id)` - Check if record exists
- `getTrackingData($conn, $studentIds, $activityIds)` - Get tracking data from all tables
- `getStudentActivityTracking($conn, $student_id, $activity_id)` - Get specific tracking data

## Migration

### Running Migration (if needed)

If you have existing data in the old `tbl_tracking` table, run the migration script:

```bash
php API/Assessment/migrate_tracking_data.php
```

This script will:
1. Check if the old table exists
2. Migrate data to appropriate level tables
3. Skip records that already exist
4. Provide a summary of the migration

### Testing the System

Run the test script to verify everything works:

```bash
php API/Assessment/test_tracking_system.php
```

## How It Works

### Adding Activities
When a new activity is added:
1. The system gets all students in the advisory
2. For each student, it determines their level_id
3. Inserts tracking records into the appropriate level table
4. If a student has no level or invalid level, the record is skipped

### Saving Ratings
When a rating is saved:
1. The system determines the student's level
2. Checks if a tracking record exists in the appropriate table
3. Updates existing record or inserts new one
4. Only affects the table for that student's level

### Retrieving Data
When fetching tracking data:
1. The system queries all three level tables
2. Combines results into a single dataset
3. Returns data in the same format as before

## Benefits

1. **Performance**: Smaller tables mean faster queries
2. **Organization**: Data is logically separated by class level
3. **Scalability**: Each level can grow independently
4. **Maintenance**: Easier to manage and backup specific levels

## Backward Compatibility

The API responses remain the same, so no frontend changes are required. The system automatically handles the routing to appropriate tables based on student levels.

## Error Handling

- If a student has no level_id, tracking operations are skipped
- If a level_id is invalid, operations return appropriate error messages
- The system gracefully handles missing tables or data

## Notes

- Students must have a valid `level_id` in `tbl_students` for tracking to work
- The old `tbl_tracking` table can be dropped after migration (if desired)
- All existing functionality remains the same from the frontend perspective 