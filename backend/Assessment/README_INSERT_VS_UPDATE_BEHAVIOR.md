# Subject Overall Progress: Insert vs Update Behavior

## Overview

The system now has two distinct scripts for handling subject overall progress:

1. **`insert_subject_overall_progress.php`** - For creating NEW records
2. **`update_subject_overall_progress.php`** - For updating EXISTING records

## Behavior Differences

### Finalize 4th Quarter (First Time)
- **Action**: Creates new progress card + computes subject overall progress
- **Script Used**: `insert_subject_overall_progress.php`
- **Database Operation**: INSERT new records into `tbl_subject_overall_progress`
- **When**: Student has never had subject overall progress calculated before

### Update 4th Quarter (Subsequent Times)
- **Action**: Updates existing progress card + recalculates subject overall progress
- **Script Used**: `update_subject_overall_progress.php`
- **Database Operation**: UPDATE existing records in `tbl_subject_overall_progress`
- **When**: Student already has subject overall progress records

## Key Benefits

1. **Data Integrity**: No more deleting and reinserting records
2. **Audit Trail**: Existing records are preserved and updated
3. **Performance**: UPDATE operations are faster than DELETE + INSERT
4. **Consistency**: Maintains record IDs and relationships

## Frontend Logic

The frontend automatically detects which script to use:

```javascript
// Check if subject overall progress already exists
const checkRes = await fetch(`/get_subject_overall_progress.php?student_id=${student_id}&advisory_id=${advisory_id}`);
const checkData = await checkRes.json();

if (checkData.status === 'success' && checkData.progress && checkData.progress.length > 0) {
    // Records exist - use UPDATE
    subjectRes = await fetch('/update_subject_overall_progress.php', {...});
} else {
    // No records exist - use INSERT
    subjectRes = await fetch('/insert_subject_overall_progress.php', {...});
}
```

## Database Operations

### INSERT Script
- Checks if records already exist (prevents duplicate insertion)
- Creates new records with calculated scores
- Returns success with inserted data

### UPDATE Script
- Verifies existing records exist (prevents unnecessary updates)
- Updates existing records with new calculated scores
- Returns success with updated data

## Testing

Use `test_insert_vs_update.php` to verify the behavior:

```bash
php test_insert_vs_update.php
```

This script will:
1. Check if records exist
2. Test the appropriate script (INSERT or UPDATE)
3. Verify the operation was performed correctly
4. Show current records

## Error Handling

### INSERT Script Errors
- "Subject overall progress records already exist. Use update_subject_overall_progress.php instead."

### UPDATE Script Errors
- "No existing subject overall progress records found. Use insert_subject_overall_progress.php instead."

## Migration Notes

- Existing systems will continue to work
- First-time finalization will use INSERT
- Subsequent updates will use UPDATE
- No data migration required

## File Structure

```
backend/Assessment/
├── insert_subject_overall_progress.php    # For new records
├── update_subject_overall_progress.php    # For existing records
├── get_subject_overall_progress.php       # For checking existing records
├── test_insert_vs_update.php             # For testing behavior
└── README_INSERT_VS_UPDATE_BEHAVIOR.md   # This file
```
