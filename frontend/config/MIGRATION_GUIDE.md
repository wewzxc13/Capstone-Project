# Migration Guide: Converting to Centralized API Configuration

This guide shows you how to migrate existing code to use the new centralized API configuration.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Step-by-Step Migration](#step-by-step-migration)
3. [Real Examples](#real-examples)
4. [Common Patterns](#common-patterns)
5. [Testing](#testing)

## Quick Reference

### Import Statement

Add this to your file:

```typescript
import { API } from '@/config/api';
```

### Quick Conversions

| Old Code | New Code |
|----------|----------|
| `"/php/login.php"` | `API.auth.login()` |
| `"/php/Users/get_all_users.php"` | `API.user.getAllUsers()` |
| `"/php/Assessment/get_visual_feedback.php"` | `API.assessment.getVisualFeedback()` |
| `"/php/Advisory/get_attendance.php"` | `API.advisory.getAttendance()` |
| `"/php/Communication/send_message.php"` | `API.communication.sendMessage()` |
| `"/php/Notifications/get_notifications.php"` | `API.notification.getNotifications()` |

## Step-by-Step Migration

### Step 1: Add the Import

At the top of your file, add:

```typescript
import { API } from '@/config/api';
```

### Step 2: Replace Hardcoded URLs

Find all instances of hardcoded `/php/` URLs and replace them with the corresponding API method.

### Step 3: Test the Changes

Run your application and test the affected functionality.

## Real Examples

### Example 1: Login Form

#### Before

```typescript
// frontend/app/LoginSection/Forms/loginform.js

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await axios.post("/php/login.php", {
      email,
      password,
    });

    if (response.data.success) {
      // Handle success
    }
  } catch (error) {
    console.error("Login error:", error);
  }
};
```

#### After

```typescript
// frontend/app/LoginSection/Forms/loginform.js
import { API } from '@/config/api';

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await axios.post(API.auth.login(), {
      email,
      password,
    });

    if (response.data.success) {
      // Handle success
    }
  } catch (error) {
    console.error("Login error:", error);
  }
};
```

### Example 2: Fetching User Details

#### Before

```typescript
const fetchUserDetails = async () => {
  const userId = localStorage.getItem("userId");
  
  try {
    const response = await fetch('/php/Users/get_user_details.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json();
    setUserData(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### After

```typescript
import { API } from '@/config/api';

const fetchUserDetails = async () => {
  const userId = localStorage.getItem("userId");
  
  try {
    const response = await fetch(API.user.getUserDetails(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await response.json();
    setUserData(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example 3: Multiple API Calls (Promise.all)

#### Before

```typescript
const promises = [
  fetch("/php/Assessment/get_visual_feedback.php"),
  fetch("/php/Advisory/get_attendance.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId }),
  }),
  fetch(`/php/Assessment/get_subjects_by_advisory.php?advisory_id=${advisoryId}`),
  fetch(`/php/Assessment/get_student_quarter_feedback.php?student_id=${studentId}`),
  fetch(`/php/Assessment/get_student_progress_cards.php?student_id=${studentId}&advisory_id=${advisoryId}`),
  fetch('/php/Assessment/get_quarters.php'),
];

const results = await Promise.all(promises);
```

#### After

```typescript
import { API } from '@/config/api';

const promises = [
  fetch(API.assessment.getVisualFeedback()),
  fetch(API.advisory.getAttendance(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId }),
  }),
  fetch(API.assessment.getSubjectsByAdvisory(advisoryId)),
  fetch(API.assessment.getStudentQuarterFeedback(studentId)),
  fetch(API.assessment.getStudentProgressCards(studentId, advisoryId)),
  fetch(API.assessment.getQuarters()),
];

const results = await Promise.all(promises);
```

### Example 4: Creating System Logs

#### Before

```typescript
try {
  const clientIp = await axios.get('https://api.ipify.org?format=json');
  
  await axios.post("/php/Logs/create_system_log.php", {
    user_id: userId,
    action: "Login",
    ip_address: clientIp.data.ip,
    details: "User logged in successfully",
  });
} catch (error) {
  console.error("Failed to create log:", error);
}
```

#### After

```typescript
import { API } from '@/config/api';

try {
  const clientIp = await axios.get(API.external.getClientIP());
  
  await axios.post(API.logs.createSystemLog(), {
    user_id: userId,
    action: "Login",
    ip_address: clientIp.data.ip,
    details: "User logged in successfully",
  });
} catch (error) {
  console.error("Failed to create log:", error);
}
```

### Example 5: Communication/Messaging

#### Before

```typescript
const sendMessage = async () => {
  try {
    const response = await axios.post("/php/Communication/send_message.php", {
      sender_id: senderId,
      receiver_id: receiverId,
      message: messageText,
    });

    if (response.data.success) {
      toast.success("Message sent!");
    }
  } catch (error) {
    toast.error("Failed to send message");
  }
};
```

#### After

```typescript
import { API } from '@/config/api';

const sendMessage = async () => {
  try {
    const response = await axios.post(API.communication.sendMessage(), {
      sender_id: senderId,
      receiver_id: receiverId,
      message: messageText,
    });

    if (response.data.success) {
      toast.success("Message sent!");
    }
  } catch (error) {
    toast.error("Failed to send message");
  }
};
```

### Example 6: Notifications

#### Before

```typescript
const fetchNotifications = async () => {
  try {
    const res = await fetch("/php/Notifications/get_notifications.php");
    const data = await res.json();
    setNotifications(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

const markAllAsRead = async () => {
  try {
    const response = await fetch("/php/Notifications/mark_all_notifications_read.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    
    await fetchNotifications();
  } catch (error) {
    console.error("Error marking notifications:", error);
  }
};
```

#### After

```typescript
import { API } from '@/config/api';

const fetchNotifications = async () => {
  try {
    const res = await fetch(API.notification.getNotifications());
    const data = await res.json();
    setNotifications(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

const markAllAsRead = async () => {
  try {
    const response = await fetch(API.notification.markAllNotificationsRead(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    
    await fetchNotifications();
  } catch (error) {
    console.error("Error marking notifications:", error);
  }
};
```

## Common Patterns

### Pattern 1: POST Request with Data

```typescript
// Before
await axios.post("/php/endpoint.php", data);

// After
import { API } from '@/config/api';
await axios.post(API.category.methodName(), data);
```

### Pattern 2: GET Request with Query Parameters

```typescript
// Before
await fetch(`/php/endpoint.php?id=${id}&type=${type}`);

// After
import { API } from '@/config/api';
await fetch(API.category.methodName(id, type));
```

### Pattern 3: Fetch with POST Body

```typescript
// Before
await fetch('/php/endpoint.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// After
import { API } from '@/config/api';
await fetch(API.category.methodName(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### Pattern 4: Multiple Endpoints in One Component

```typescript
// Before
const endpoint1 = "/php/Users/get_user_details.php";
const endpoint2 = "/php/Assessment/get_progress_cards.php";
const endpoint3 = "/php/Advisory/get_attendance.php";

// After
import { API } from '@/config/api';
const endpoint1 = API.user.getUserDetails();
const endpoint2 = API.assessment.getStudentProgressCards(studentId, advisoryId);
const endpoint3 = API.advisory.getAttendance();
```

## API Category Reference

Quick lookup for which category to use:

- **Authentication**: `API.auth.*` - login, signup, OTP, password
- **Users**: `API.user.*` - user management, profiles, students
- **Assessment**: `API.assessment.*` - progress cards, feedback, comments
- **Advisory**: `API.advisory.*` - class management, attendance
- **Communication**: `API.communication.*` - messages, groups
- **Notifications**: `API.notification.*` - notifications, read status
- **Meeting**: `API.meeting.*` - meetings, reminders
- **Schedule**: `API.schedule.*` - schedules
- **Logs**: `API.logs.*` - system logs
- **External**: `API.external.*` - external APIs (IP lookup)
- **Uploads**: `API.uploads.*` - file uploads, images

## Testing

After migration, test the following:

1. **Basic Functionality**
   - Does the feature still work as expected?
   - Are API calls successful?
   - Is data being displayed correctly?

2. **Error Handling**
   - Do errors display properly?
   - Are error messages informative?

3. **Network Tab**
   - Open browser DevTools → Network tab
   - Check that requests are going to the correct URLs
   - Verify the `/php/` prefix is being rewritten correctly

4. **Console Logs**
   - Check for any console errors
   - Verify no 404 or 500 errors

## Troubleshooting

### Issue: Cannot find module '@/config/api'

**Solution**: Make sure the `jsconfig.json` is configured correctly:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: API calls return 404

**Solution**: 
1. Check that `next.config.js` has the rewrites configured
2. Restart your development server
3. Verify the endpoint path is correct

### Issue: TypeScript errors

**Solution**: The file uses TypeScript but your project might need to install types:

```bash
npm install --save-dev @types/node
```

Or convert `api.ts` to `api.js` if you don't want TypeScript.

## Need Help?

- See `config/README.md` for API documentation
- See `config/usage-examples.ts` for more examples
- See `ENV_SETUP.md` for environment variable setup

## Checklist

Use this checklist when migrating a file:

- [ ] Import the API configuration at the top
- [ ] Find all hardcoded `/php/` URLs
- [ ] Replace each URL with the corresponding API method
- [ ] Test the functionality
- [ ] Check the browser console for errors
- [ ] Verify network requests in DevTools
- [ ] Update any related tests
- [ ] Document any custom endpoints not in the API config

