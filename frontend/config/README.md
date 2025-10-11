# API Configuration

This directory contains centralized API configuration for the application.

## Files

- `api.ts` - Centralized API endpoints and axios configuration

## Setup

### 1. Create Environment Variables File

Create a `.env.local` file in the `frontend` directory with the following variables:

```env
# API Base URL Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost
NEXT_PUBLIC_BACKEND_PATH=/capstone-project/backend
```

**Note:** The `.env.local` file is gitignored and should not be committed to version control.

### 2. Environment Configuration

#### Development
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost
NEXT_PUBLIC_BACKEND_PATH=/capstone-project/backend
```

#### Production
```env
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com
NEXT_PUBLIC_BACKEND_PATH=/backend
```

## Usage

### Basic Import

```typescript
import { API } from '@/config/api';
```

### Using API Endpoints

#### Authentication

```typescript
import axios from 'axios';
import { API } from '@/config/api';

// Login
const response = await axios.post(API.auth.login(), {
  email: 'user@example.com',
  password: 'password123'
});

// Send OTP
await axios.post(API.auth.sendOTP(), {
  email: 'user@example.com'
});
```

#### User Management

```typescript
// Get user details
const response = await axios.post(API.user.getUserDetails(), {
  user_id: userId
});

// Get all users
const users = await axios.get(API.user.getAllUsers());

// Update user
await axios.post(API.user.updateUser(), userData);
```

#### Assessment

```typescript
// Get student progress cards
const progressCards = await axios.get(
  API.assessment.getStudentProgressCards(studentId, advisoryId)
);

// Create comment
await axios.post(API.assessment.createComment(), {
  student_id: studentId,
  comment: 'Great progress!'
});

// Get overall progress
const progress = await axios.get(
  API.assessment.getOverallProgress(studentId, advisoryId)
);
```

#### Advisory/Attendance

```typescript
// Get advisory details
const advisory = await axios.post(API.advisory.getAdvisoryDetails(), {
  student_id: studentId
});

// Update attendance
await axios.post(API.advisory.updateAttendance(), {
  student_id: studentId,
  status: 'present',
  date: '2024-01-01'
});
```

#### Communication

```typescript
// Send message
await axios.post(API.communication.sendMessage(), {
  receiver_id: receiverId,
  message: 'Hello!'
});

// Get conversations
const conversations = await axios.get(API.communication.getRecentConversations());

// Send group message
await axios.post(API.communication.sendGroupMessage(), {
  group_id: groupId,
  message: 'Hello everyone!'
});
```

#### Notifications

```typescript
// Get notifications
const notifications = await axios.get(API.notification.getNotifications());

// Mark all as read
await axios.post(API.notification.markAllNotificationsRead(), {
  user_id: userId
});

// Count unread
const count = await axios.get(API.notification.countUnreadNotifications());
```

### Using the API Client

The `apiClient` is a pre-configured axios instance with interceptors:

```typescript
import { apiClient, API } from '@/config/api';

// Use apiClient for requests
const response = await apiClient.post(API.auth.login(), {
  email: 'user@example.com',
  password: 'password123'
});
```

### Using the Utility Function

```typescript
import { apiRequest, API } from '@/config/api';

// GET request
const data = await apiRequest(API.user.getAllUsers());

// POST request
const result = await apiRequest(API.user.createUser(), {
  method: 'POST',
  data: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

## Migration Guide

### Before (Old Way)

```typescript
// Direct axios calls with hardcoded URLs
const response = await axios.post("/php/login.php", {
  email,
  password
});

const users = await fetch("/php/Users/get_all_users.php");
```

### After (New Way)

```typescript
import { API } from '@/config/api';

// Using centralized API configuration
const response = await axios.post(API.auth.login(), {
  email,
  password
});

const users = await fetch(API.user.getAllUsers());
```

## Benefits

1. **Centralized Configuration** - All endpoints in one place
2. **Easy Maintenance** - Update URLs in one location
3. **Environment Support** - Easy switching between dev/prod
4. **Type Safety** - TypeScript support for better IDE experience
5. **Consistent Error Handling** - Axios interceptors for global error handling
6. **Better Organization** - Endpoints grouped by feature

## API Structure

The API is organized into the following modules:

- `auth` - Authentication (login, signup, OTP)
- `user` - User management
- `assessment` - Student assessments and progress
- `advisory` - Advisory classes and attendance
- `communication` - Messaging and conversations
- `notification` - Notifications
- `meeting` - Meeting management
- `schedule` - Schedule management
- `logs` - System logs
- `external` - External APIs (e.g., IP lookup)
- `uploads` - File uploads

## Next.js Rewrites

The application uses Next.js rewrites to proxy API requests. This is configured in `next.config.js`:

```javascript
async rewrites() {
  const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost";
  return [
    {
      source: "/php/:path*",
      destination: `${BACKEND_ORIGIN}/capstone-project/backend/:path*`,
    },
  ];
}
```

This means:
- Frontend request: `/php/login.php`
- Backend destination: `http://localhost/capstone-project/backend/login.php`

## Notes

- All endpoints use the `/php/` prefix which is rewritten by Next.js
- Environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser
- The axios client has a 30-second timeout by default
- Error handling is built into the axios interceptors

