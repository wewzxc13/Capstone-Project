# Parent Archiving System

## Overview
This system handles the archiving of parent accounts with automatic unlinking of their associated students. When a parent is archived, all linked students are automatically unlinked and set to inactive status.

## How It Works

### Frontend Implementation (ViewUser page)
The parent archiving process is handled in the frontend `ViewUser` page (`frontend/app/SuperAdminSection/Users/ViewUser/page.js`):

1. **Student Unlinking Process**:
   - Fetches all students linked to the parent using `get_parent_students.php`
   - For each linked student, calls `update_student.php` to:
     - Set `parent_id` to `NULL`
     - Set `parent_profile_id` to `NULL`
     - Set `stud_school_status` to `"Inactive"`

2. **User Experience**:
   - Shows warning message in archive confirmation modal for parents
   - Displays success toast message showing how many students were unlinked
   - Continues with normal archiving process

### Backend Scripts

#### `archive_user.php`
- **Updated**: Removed old parent handling logic
- **Current**: Only handles basic user archiving (sets status to 'Inactive')
- **Note**: Parent archiving with student unlinking is now handled in the frontend

#### `update_student.php`
- **Supports**: Setting `parent_id` and `parent_profile_id` to `NULL`
- **Handles**: NULL values properly in database updates
- **Used for**: Student unlinking during parent archiving

#### `get_parent_students.php`
- **Purpose**: Retrieves all students linked to a specific parent
- **Method**: GET request with `parent_id` parameter
- **Returns**: List of students with their details

## Database Changes

When a parent is archived, the following changes occur:

### Students Table (`tbl_students`)
```sql
UPDATE tbl_students 
SET 
    parent_id = NULL,
    parent_profile_id = NULL,
    stud_school_status = 'Inactive'
WHERE parent_id = [PARENT_ID]
```

### Users Table (`tbl_users`)
```sql
UPDATE tbl_users 
SET user_status = 'Inactive' 
WHERE user_id = [PARENT_ID]
```

## Testing

### Test Script: `test_parent_archiving.php`
Run this script to verify the parent archiving system:

1. **Test 1**: Current parent-student relationships
2. **Test 2**: Students with NULL parent_id
3. **Test 3**: Students with active parents
4. **Test 4**: Summary statistics

### Manual Testing
1. Navigate to a parent user in the ViewUser page
2. Click "Archive User"
3. Confirm the archive action
4. Verify that:
   - Parent status is set to 'Inactive'
   - All linked students have `parent_id` and `parent_profile_id` set to NULL
   - All linked students have `stud_school_status` set to 'Inactive'

## Benefits

1. **Data Integrity**: Prevents orphaned student records
2. **Clean Unlinking**: Students are properly unlinked from archived parents
3. **Status Management**: Students are automatically set to inactive
4. **User Experience**: Clear warnings and feedback during the process
5. **No System Logs**: Student unlinking doesn't create unnecessary system logs

## Error Handling

- **Student Unlinking Failures**: If student unlinking fails, parent archiving still proceeds
- **Database Errors**: Proper error handling and rollback mechanisms
- **Network Issues**: Graceful degradation if API calls fail

## Security Considerations

- **Authentication**: Only Super Admin users can archive parents
- **Validation**: Proper input validation and sanitization
- **Transaction Safety**: Database operations use transactions for consistency

## Future Enhancements

1. **Bulk Operations**: Support for archiving multiple parents at once
2. **Restore Functionality**: Ability to restore parent-student relationships
3. **Audit Trail**: Optional logging of student unlinking actions
4. **Notification System**: Alert parents before archiving their account

## API Endpoints Used

- `GET /get_parent_students.php?parent_id={id}` - Get students linked to parent
- `POST /update_student.php` - Update student records (unlinking)
- `POST /archive_user.php` - Archive parent user account

## Dependencies

- Frontend: React/Next.js with toast notifications
- Backend: PHP with PDO database connections
- Database: MySQL/MariaDB with proper foreign key constraints
