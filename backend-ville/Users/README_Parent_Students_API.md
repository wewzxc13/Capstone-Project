# Parent Students API Documentation

## Overview
The `get_parent_students.php` API retrieves student information for a specific parent, including total children count, active students count, and detailed student information.

## API Endpoint
```
GET /backend/Users/get_parent_students.php?parent_id={parent_id}
```

## Parameters
- `parent_id` (required): The ID of the parent user from `tbl_users`

## Response Format

### Success Response (200)
```json
{
  "status": "success",
  "data": {
    "parent_id": 23,
    "total_children": 2,
    "active_students": 2,
    "statistics": {
      "male_count": 1,
      "female_count": 1,
      "active_count": 2,
      "inactive_count": 0
    },
    "students": [
      {
        "student_id": 45,
        "first_name": "John",
        "middle_name": "Michael",
        "last_name": "Doe",
        "full_name": "John Michael Doe",
        "birthdate": "2010-05-15",
        "enrollment_date": "2020-06-01",
        "handedness": "Right",
        "gender": "Male",
        "schedule_class": "Morning",
        "photo": "photo_url.jpg",
        "school_status": "Active",
        "level_id": 5,
        "level_name": "Grade 5",
        "level_description": "Elementary Level",
        "age": 13
      }
    ]
  }
}
```

### Error Response (400/405/500)
```json
{
  "status": "error",
  "message": "Error description",
  "error": "Technical error details (if available)"
}
```

## Database Tables Used
- `tbl_students` - Main student information
- `tbl_levels` - Student grade levels (joined for level names)

## Key Features
1. **Total Children Count**: Counts all students linked to the parent
2. **Active Students Count**: Counts only students with `stud_school_status = 'Active'`
3. **Gender Statistics**: Breakdown by male/female students
4. **Status Statistics**: Breakdown by active/inactive students
5. **Student Details**: Complete student information including calculated age
6. **Level Information**: Grade level details for each student

## Usage Examples

### Frontend JavaScript
```javascript
// Get parent students data
const getParentStudents = async (parentId) => {
  try {
    const response = await fetch(`/backend/Users/get_parent_students.php?parent_id=${parentId}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      // Update dashboard stats
      document.getElementById('total-children').textContent = data.data.total_children;
      document.getElementById('active-students').textContent = data.data.active_students;
      
      // Display student list
      displayStudents(data.data.students);
    }
  } catch (error) {
    console.error('Error fetching parent students:', error);
  }
};
```

### PHP Integration
```php
// Include the API in another script
$parentId = 23;
$apiUrl = "get_parent_students.php?parent_id=" . $parentId;
$response = file_get_contents($apiUrl);
$data = json_decode($response, true);

if ($data['status'] === 'success') {
    $totalChildren = $data['data']['total_children'];
    $activeStudents = $data['data']['active_students'];
    $students = $data['data']['students'];
}
```

## Testing
Use the `test_parent_students.php` script to test the API:
1. Ensure XAMPP server is running
2. Navigate to `/backend/Users/test_parent_students.php` in your browser
3. The script will test with parent_id = 23 (Margareth Manongdo)

## Notes
- The API only returns students where both `parent_id` and `parent_profile_id` are set
- Students are ordered by first name, then last name
- Age is calculated automatically from birthdate
- All database queries use prepared statements for security
- CORS headers are included for cross-origin requests

## Error Handling
- **400**: Invalid or missing parent_id parameter
- **405**: Wrong HTTP method (only GET allowed)
- **500**: Database or server error
