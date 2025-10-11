# Advisory Management System

## Overview
This system manages student assignments to advisory classes without causing unnecessary database operations. The new approach ensures that linking/unlinking students only affects the specific student and their advisory, not the entire system.

## Key Changes Made

### 1. **Eliminated Bulk Reassignment**
- **Before**: `auto_assign_students.php` was deleting and re-inserting ALL student assignments
- **After**: Only the specific student being linked/unlinked is affected

### 2. **Targeted Operations**
- **Linking**: Only assigns the specific student to their appropriate advisory
- **Unlinking**: Only removes the specific student from their advisory
- **Count Updates**: Only updates counts for the affected advisory

## API Endpoints

### 1. **Link Student to Parent** (`link_student_to_parent.php`)
**Purpose**: Links a student to a parent and assigns them to the appropriate advisory class.

**Request**:
```json
{
  "student_id": 123,
  "parent_id": 456,
  "parent_profile_id": 789
}
```

**What it does**:
- Updates student's parent information
- Finds the appropriate advisory based on student's level
- Assigns student to that advisory
- Updates gender counts for that specific advisory only
- Uses database transactions for data consistency

### 2. **Unlink Student from Parent** (`unlink_student_from_parent.php`)
**Purpose**: Removes the link between a student and parent, and removes them from advisory.

**Request**:
```json
{
  "student_id": 123
}
```

**What it does**:
- Removes parent link from student
- Removes student from their current advisory assignment
- Updates gender counts for that specific advisory only
- Uses database transactions for data consistency

### 3. **Update Advisory Counts** (`update_advisory_counts.php`)
**Purpose**: Utility function to update advisory counts when needed.

**Options**:
- **Update specific advisory**: Send `{"advisory_id": 123}`
- **Update all advisories**: Send `{}` or no data

## Benefits of New Approach

### 1. **Performance**
- No more bulk deletions and re-insertions
- Only affected records are modified
- Faster response times

### 2. **Data Integrity**
- Database transactions ensure consistency
- No risk of partial updates
- Rollback on errors

### 3. **Scalability**
- Operations scale with individual students, not total system size
- No performance degradation as system grows

### 4. **Maintenance**
- Easier to debug issues
- Clear audit trail of changes
- Reduced database fragmentation

## When to Use Each Endpoint

### **For Regular Operations (Use these)**:
- `link_student_to_parent.php` - When linking students to parents
- `unlink_student_from_parent.php` - When unlinking students from parents

### **For Maintenance/Setup (Use sparingly)**:
- `update_advisory_counts.php` - When you need to sync all advisory counts
- `auto_assign_students.php` - **DEPRECATED** - Only for initial system setup

## Database Impact

### **Before (Problematic)**:
```
Linking 1 student → Delete ALL assignments → Re-insert ALL assignments
Result: 13 deletions + 13 insertions for 1 student change
```

### **After (Efficient)**:
```
Linking 1 student → Insert 1 assignment + Update 1 advisory count
Result: 1 insertion + 1 update for 1 student change
```

## Migration Notes

If you have existing code that calls `auto_assign_students.php`, consider:

1. **Replace with targeted operations** where possible
2. **Use `update_advisory_counts.php`** for bulk count updates
3. **Keep `auto_assign_students.php`** only for initial system setup

## Error Handling

All endpoints now use database transactions:
- **Success**: All changes are committed
- **Failure**: All changes are rolled back
- **Consistency**: Database remains in a valid state

## Testing

Test the new endpoints with:
1. **Single student operations** (link/unlink)
2. **Verify advisory counts** are updated correctly
3. **Check that other students** are not affected
4. **Test error scenarios** (invalid IDs, database issues) 