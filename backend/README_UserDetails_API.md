# User Details API Documentation

## Overview
This API provides user details for the Topbar component in the frontend application. It fetches user information from the `tbl_users` table and returns formatted data including the user's full name and role.

## API Endpoint

### GET_USER_DETAILS.PHP
**URL:** `/php/Users/get_user_details.php`  
**Method:** POST  
**Content-Type:** application/json

### Request Body
```json
{
  "user_id": 1
}
```

### Response Format
**Success Response (200):**
```json
{
  "status": "success",
  "user": {
    "id": 1,
    "firstName": "John",
    "middleName": "Michael",
    "lastName": "Doe",
    "fullName": "John Michael Doe",
    "email": "john.doe@example.com",
    "contactNo": "1234567890",
    "role": "Super Admin",
    "status": "Active"
  }
}
```

**Error Responses:**
- **400 Bad Request:** Missing or invalid user_id
- **404 Not Found:** User not found or inactive
- **405 Method Not Allowed:** Only POST requests allowed
- **500 Internal Server Error:** Database error

## Database Schema
The API queries the following tables:
- `tbl_users` - User information
- `tbl_roles` - Role information (joined to get role_name)

## Frontend Integration

### Topbar Component Updates
The Topbar component (`capstone/app/Topbar/Topbar.js`) has been updated to:

1. **Fetch Real User Data:** Makes API call to get user details from backend
2. **Fallback Handling:** Uses localStorage data if API fails
3. **Loading States:** Shows "Loading..." while fetching data
4. **Error Handling:** Gracefully handles API errors

### localStorage Structure
The login process stores:
- `userId` - User ID from database
- `userRole` - User role (Super Admin, Admin, Teacher, Parent)

### Usage in Topbar
```javascript
// Fetch user details on component mount
useEffect(() => {
  const fetchUserDetails = async () => {
    const userId = localStorage.getItem('userId');
    const response = await fetch('/php/Users/get_user_details.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    // Handle response...
  };
  fetchUserDetails();
}, []);
```

## Testing

### Test File
Use `test_user_details.php` to test the API:
1. Update the `$testUserId` variable with a valid user ID from your database
2. Access `http://localhost/capstone-project/test_user_details.php` in your browser
3. Review the API responses

### Manual Testing
1. Login to the application
2. Navigate to any page with the Topbar component
3. Verify that the username and role are displayed correctly
4. Check browser console for any API errors

## Error Logging
API errors are logged to `API/SystemLogs/error_log.txt` with timestamps for debugging.

## Security Considerations
- API validates user_id input
- Only returns active users
- CORS headers configured for localhost:3000
- SQL injection protection with prepared statements

## Dependencies
- PHP PDO for database connections
- MySQL/MariaDB database
- CORS support for cross-origin requests

## Troubleshooting

### Common Issues
1. **API Not Found:** Ensure the PHP file is in the correct location (`API/Users/get_user_details.php`)
2. **Database Connection:** Check connection.php configuration
3. **CORS Errors:** Verify the frontend is running on localhost:3000
4. **User Not Found:** Confirm the user_id exists and is active

### Debug Steps
1. Check browser console for JavaScript errors
2. Review API error logs in SystemLogs directory
3. Test API directly with test_user_details.php
4. Verify localStorage contains valid userId and userRole 