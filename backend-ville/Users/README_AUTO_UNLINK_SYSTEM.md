# Automatic Unlinking System for Archived Parents

## Overview

This system automatically unlinks all students from parents when those parents are archived (status changed to 'Inactive'). This ensures data integrity and prevents orphaned student records from remaining linked to archived parent accounts.

## How It Works

### 1. **Automatic Trigger (Recommended)**
- **Database Trigger**: `tr_auto_unlink_archived_parents`
- **Fires**: When a parent user's status is updated from 'Active' to 'Inactive'
- **Action**: Automatically sets `parent_id = NULL` for all students linked to that parent
- **Logging**: Records all actions in `tbl_system_logs` for audit purposes

### 2. **Manual Cleanup Scripts**
- **Cleanup Existing**: `cleanup_existing_archived_parents.php` - Handles existing archived parents
- **Manual Trigger**: `auto_unlink_archived_parents.php` - Can be run manually if needed

## Files Created

### **Core System Files**
1. **`create_auto_unlink_trigger.sql`** - Database trigger setup
2. **`auto_unlink_archived_parents.php`** - Manual unlinking script
3. **`cleanup_existing_archived_parents.php`** - Cleanup existing archived parents
4. **`test_auto_unlink_system.php`** - System testing and verification

### **Database Views Created**
1. **`v_archived_parents_unlinked_students`** - View of archived parents and their unlinked students
2. **`v_orphaned_students`** - View of all students without parent links

## Installation Steps

### **Step 1: Set Up Database Trigger**
```sql
-- Run the SQL commands in create_auto_unlink_trigger.sql
-- This creates the automatic trigger for future parent archiving
```

### **Step 2: Clean Up Existing Data**
```bash
# Run cleanup script to handle existing archived parents
POST http://localhost/capstone-project/backend/Users/cleanup_existing_archived_parents.php
```

### **Step 3: Test the System**
```bash
# Verify the system is working correctly
GET http://localhost/capstone-project/backend/Users/test_auto_unlink_system.php
```

## How the Trigger Works

### **Trigger Logic**
```sql
-- Trigger fires when user status changes
IF NEW.user_status = 'Inactive' AND OLD.user_status = 'Active' AND NEW.user_role = 'Parent' THEN
    
    -- Log the parent archiving
    INSERT INTO tbl_system_logs (action_type, action_description, ...)
    
    -- Count students to be unlinked
    SET @student_count = (SELECT COUNT(*) FROM tbl_students WHERE parent_id = NEW.user_id)
    
    -- Unlink all students
    UPDATE tbl_students SET parent_id = NULL WHERE parent_id = NEW.user_id
    
    -- Log the unlinking action
    INSERT INTO tbl_system_logs (action_type, action_description, ...)
    
END IF
```

### **What Happens When a Parent is Archived**
1. **Parent Status Changed**: User status updated to 'Inactive'
2. **Trigger Fires**: Automatically detects the change
3. **Students Unlinked**: All linked students have `parent_id` set to `NULL`
4. **Actions Logged**: Complete audit trail in system logs
5. **Data Integrity**: No orphaned student records

## API Endpoints

### **1. Cleanup Existing Archived Parents**
```http
POST /backend/Users/cleanup_existing_archived_parents.php
```

**Response:**
```json
{
  "status": "success",
  "message": "Cleanup completed! Unlinked 5 student(s) from 2 archived parent(s)",
  "total_unlinked_count": 5,
  "archived_parents_count": 2,
  "cleanup_details": [...],
  "timestamp": "2025-01-30 12:00:00"
}
```

### **2. Manual Unlinking**
```http
POST /backend/Users/auto_unlink_archived_parents.php
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully unlinked 3 student(s) from 1 archived parent(s)",
  "unlinked_count": 3,
  "archived_parents_count": 1,
  "unlinked_details": [...],
  "timestamp": "2025-01-30 12:00:00"
}
```

### **3. System Testing**
```http
GET /backend/Users/test_auto_unlink_system.php
```

**Response:**
```json
{
  "status": "success",
  "test_results": {
    "summary": {
      "total_parents": 25,
      "active_parents": 23,
      "archived_parents": 2,
      "students_with_parents": 45,
      "students_without_parents": 3
    },
    "analysis": {
      "system_health": "GOOD",
      "recommendations": [...]
    }
  }
}
```

## System Logs

### **Log Entry Types**
1. **`PARENT_ARCHIVED`** - When a parent is archived
2. **`AUTO_UNLINK_STUDENTS`** - When students are automatically unlinked
3. **`CLEANUP_ARCHIVED_PARENT`** - When cleanup scripts are run

### **Log Data Structure**
```json
{
  "action_type": "AUTO_UNLINK_STUDENTS",
  "action_description": "Automatically unlinked 3 student(s) from archived parent: John Doe",
  "affected_table": "tbl_students",
  "affected_record_id": "123",
  "additional_data": {
    "parent_name": "John Doe",
    "parent_id": "123",
    "unlinked_students_count": 3,
    "reason": "Parent archived - automatic unlink",
    "timestamp": "2025-01-30 12:00:00"
  },
  "timestamp": "2025-01-30 12:00:00"
}
```

## Benefits

### **1. Data Integrity**
- No orphaned student records
- Consistent parent-student relationships
- Clean database state

### **2. Automatic Operation**
- No manual intervention required
- Immediate response to parent archiving
- Consistent behavior across the system

### **3. Audit Trail**
- Complete logging of all actions
- Traceable changes for compliance
- Historical record of parent-student relationships

### **4. System Health**
- Prevents data inconsistencies
- Maintains referential integrity
- Improves system reliability

## Monitoring and Maintenance

### **Regular Checks**
1. **System Health**: Run test script monthly
2. **Log Review**: Check system logs for auto-unlink actions
3. **Data Validation**: Verify no archived parents have linked students

### **Troubleshooting**
1. **If trigger fails**: Check database permissions and trigger status
2. **If cleanup fails**: Review error logs and database constraints
3. **If logs are missing**: Verify `tbl_system_logs` table exists and is accessible

### **Performance Considerations**
- Triggers have minimal performance impact
- Unlinking operations are fast (simple UPDATE statements)
- Logging operations are lightweight

## Security Considerations

### **Access Control**
- Scripts should only be accessible to authorized users
- Consider adding authentication checks
- Log all access attempts

### **Data Protection**
- No sensitive data is exposed in logs
- Student information is anonymized in audit trails
- Parent personal data is protected

## Future Enhancements

### **Potential Improvements**
1. **Batch Processing**: Handle large numbers of students efficiently
2. **Notification System**: Alert administrators of auto-unlink actions
3. **Recovery Options**: Allow manual re-linking if needed
4. **Scheduled Cleanup**: Automatic periodic cleanup runs

### **Integration Opportunities**
1. **User Management**: Integrate with user archiving workflows
2. **Reporting**: Include auto-unlink statistics in system reports
3. **Dashboard**: Show system health status in admin dashboard

## Conclusion

The Automatic Unlinking System provides a robust, reliable solution for maintaining data integrity when parents are archived. By combining database triggers with comprehensive logging and cleanup tools, it ensures that the system remains consistent and auditable while requiring minimal manual intervention.

**Key Benefits:**
- ✅ **Automatic Operation**: No manual work required
- ✅ **Data Integrity**: Prevents orphaned records
- ✅ **Complete Auditing**: Full audit trail of all actions
- ✅ **System Health**: Maintains clean database state
- ✅ **Easy Maintenance**: Simple testing and monitoring tools

This system ensures that your LinkedStudent page will always show accurate, up-to-date information about parent-student relationships.
