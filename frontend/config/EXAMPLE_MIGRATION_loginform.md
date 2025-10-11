# Example Migration: LoginForm.js

This document shows a practical example of migrating the `LoginForm.js` file to use the centralized API configuration.

## File: `frontend/app/LoginSection/Forms/loginform.js`

### Changes Required

1. Add import statement for API configuration
2. Replace hardcoded URLs with API methods
3. Test the functionality

---

## Migration Steps

### Step 1: Add Import at the Top

**Add this line after the existing imports:**

```javascript
import { API } from '@/config/api';
```

**Complete import section should look like:**

```javascript
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash, FaRedo, FaCheckCircle, FaEnvelope } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "../../Context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRef } from "react";
import { API } from '@/config/api';  // <-- ADD THIS LINE
```

### Step 2: Update handleLogin Function

#### Before (Line ~617)

```javascript
const response = await axios.post("/php/login.php", {
  email,
  password,
});
```

#### After

```javascript
const response = await axios.post(API.auth.login(), {
  email,
  password,
});
```

### Step 3: Update System Log Calls

#### Before (Line ~483 and ~487)

```javascript
const clientIp = await axios.get('https://api.ipify.org?format=json');

// ... later

await axios.post("/php/Logs/create_system_log.php", {
  user_id: loginUserId,
  action: "Failed Login Attempt",
  details: `Failed login attempt for email: ${email}. Reason: ${response.data.message}`,
  ip_address: clientIp.data.ip,
  timestamp: new Date().toISOString()
});
```

#### After

```javascript
const clientIp = await axios.get(API.external.getClientIP());

// ... later

await axios.post(API.logs.createSystemLog(), {
  user_id: loginUserId,
  action: "Failed Login Attempt",
  details: `Failed login attempt for email: ${email}. Reason: ${response.data.message}`,
  ip_address: clientIp.data.ip,
  timestamp: new Date().toISOString()
});
```

### Step 4: Update All Other System Log Calls

Find and replace all instances of:

```javascript
"/php/Logs/create_system_log.php"
```

With:

```javascript
API.logs.createSystemLog()
```

---

## Complete Example: handleLogin Function

### Before

```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setLoginSuccess(false);
  let attemptDecremented = false;

  // Email validation
  if (!email) {
    toast.error("Please enter your email.", { containerId: 'login' });
    return;
  }

  if (!validateEmail(email)) {
    toast.error("Please enter a valid email address.", { containerId: 'login' });
    return;
  }

  // Password validation
  if (!password) {
    toast.error("Please enter your password.", { containerId: 'login' });
    return;
  }

  // Captcha validation
  const storedCaptcha = localStorage.getItem("captchaNumbers");
  if (storedCaptcha) {
    const { num1, num2 } = JSON.parse(storedCaptcha);
    if (parseInt(captchaInput) !== parseInt(num1) + parseInt(num2)) {
      toast.error("Incorrect CAPTCHA. Please try again.", { containerId: 'login' });
      if (!attemptDecremented) setAttempts((prev) => prev > 0 ? prev - 1 : 0);
      attemptDecremented = true;
      setShakeCaptcha(true);
      setTimeout(() => setShakeCaptcha(false), 500);
      return;
    }
  }

  setLoading(true);

  try {
    const response = await axios.post("/php/login.php", {
      email,
      password,
    });

    if (response.data.success) {
      // Clear localStorage on successful login
      localStorage.removeItem("captchaInput");

      // Set success state
      setLoginSuccess(true);
      setResponseUserData(response.data.userData);

      // Handle login success...
      // (rest of the code)
    } else {
      // Handle login failure...
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.error("An error occurred. Please try again.", { containerId: 'login' });
  } finally {
    setLoading(false);
  }
};
```

### After

```javascript
import { API } from '@/config/api';  // At the top of the file

const handleLogin = async (e) => {
  e.preventDefault();
  setLoginSuccess(false);
  let attemptDecremented = false;

  // Email validation
  if (!email) {
    toast.error("Please enter your email.", { containerId: 'login' });
    return;
  }

  if (!validateEmail(email)) {
    toast.error("Please enter a valid email address.", { containerId: 'login' });
    return;
  }

  // Password validation
  if (!password) {
    toast.error("Please enter your password.", { containerId: 'login' });
    return;
  }

  // Captcha validation
  const storedCaptcha = localStorage.getItem("captchaNumbers");
  if (storedCaptcha) {
    const { num1, num2 } = JSON.parse(storedCaptcha);
    if (parseInt(captchaInput) !== parseInt(num1) + parseInt(num2)) {
      toast.error("Incorrect CAPTCHA. Please try again.", { containerId: 'login' });
      if (!attemptDecremented) setAttempts((prev) => prev > 0 ? prev - 1 : 0);
      attemptDecremented = true;
      setShakeCaptcha(true);
      setTimeout(() => setShakeCaptcha(false), 500);
      return;
    }
  }

  setLoading(true);

  try {
    const response = await axios.post(API.auth.login(), {  // <-- CHANGED
      email,
      password,
    });

    if (response.data.success) {
      // Clear localStorage on successful login
      localStorage.removeItem("captchaInput");

      // Set success state
      setLoginSuccess(true);
      setResponseUserData(response.data.userData);

      // Handle login success...
      // (rest of the code remains the same)
    } else {
      // Handle login failure...
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.error("An error occurred. Please try again.", { containerId: 'login' });
  } finally {
    setLoading(false);
  }
};
```

---

## All Changes Summary

Here are all the URLs in `loginform.js` that need to be changed:

| Line | Before | After |
|------|--------|-------|
| ~483 | `'https://api.ipify.org?format=json'` | `API.external.getClientIP()` |
| ~487 | `"/php/Logs/create_system_log.php"` | `API.logs.createSystemLog()` |
| ~525 | `'https://api.ipify.org?format=json'` | `API.external.getClientIP()` |
| ~529 | `"/php/Logs/create_system_log.php"` | `API.logs.createSystemLog()` |
| ~617 | `"/php/login.php"` | `API.auth.login()` |

---

## Testing Checklist

After making these changes:

### 1. Visual Testing
- [ ] Login form still displays correctly
- [ ] CAPTCHA works
- [ ] Form validation works

### 2. Functional Testing
- [ ] Can login with valid credentials
- [ ] Invalid credentials show error message
- [ ] Wrong CAPTCHA shows error
- [ ] Success redirect works
- [ ] Toast notifications appear

### 3. Technical Testing
- [ ] Open DevTools → Network tab
- [ ] Submit login form
- [ ] Verify request goes to correct URL
- [ ] Check console for errors
- [ ] Verify system logs are created

### 4. Different User Roles
- [ ] Test login as Teacher
- [ ] Test login as Parent
- [ ] Test login as Admin
- [ ] Test login as SuperAdmin

---

## Expected Behavior

### Network Requests

You should see these requests in the Network tab:

1. **GET** `https://api.ipify.org?format=json` (for IP lookup)
2. **POST** `/php/login.php` (rewritten to backend)
3. **POST** `/php/Logs/create_system_log.php` (if logging is enabled)

### Console Output

No errors should appear in the console. You should see:
- User data logged after successful login
- Role information
- Any debug logs from the login process

---

## Rollback Plan

If something goes wrong, you can quickly revert:

1. Remove the import line:
   ```javascript
   import { API } from '@/config/api';
   ```

2. Use Find & Replace to revert all changes:
   - `API.auth.login()` → `"/php/login.php"`
   - `API.logs.createSystemLog()` → `"/php/Logs/create_system_log.php"`
   - `API.external.getClientIP()` → `'https://api.ipify.org?format=json'`

---

## Benefits After Migration

1. **Easier Maintenance**: Change API URLs in one place
2. **Environment Support**: Automatically uses correct URLs for dev/prod
3. **Type Safety**: Better autocomplete in IDE
4. **Consistency**: All pages use the same API configuration
5. **Centralized Error Handling**: Axios interceptors handle errors globally

---

## Next Steps

After successfully migrating `loginform.js`:

1. Test thoroughly
2. Migrate other pages using the same pattern
3. Document any custom endpoints not in the API config
4. Update team members on the new structure

---

## Questions?

- See `config/README.md` for full API documentation
- See `config/MIGRATION_GUIDE.md` for more examples
- See `config/usage-examples.ts` for code samples

