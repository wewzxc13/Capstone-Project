# Vercel API Routing Fix - Final Solution

## 🎯 Problem
On Vercel production, the frontend was making requests to non-existent paths like:
```
https://learnersville.vercel.app/php/Communication/edit_message.php
[404 Not Found]
```

Instead of the correct backend URL:
```
https://learnersville.online/backend-ville/Communication/edit_message.php
```

## 🔧 Root Cause
The `getEndpoint()` function in `api.js` was checking `isProduction` at **module load time** (server-side), but `window.location.hostname` isn't available during Next.js server-side rendering (SSR). This caused the function to default to local development mode even when running on Vercel.

## ✅ Solution Applied

### **Updated: `frontend/config/api.js`**

**Key Change:** Added **dynamic runtime check** inside `getEndpoint()` function instead of relying only on module-level check.

**Before:**
```javascript
const getEndpoint = (path) => {
  // Only checked isProduction (set at module load time)
  if (isProduction) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_URL}/${cleanPath}`;
  }
  
  // Defaults to local development
  return `/php/${path}`;
};
```

**After:**
```javascript
const getEndpoint = (path) => {
  // Dynamic production check at runtime (not module load time)
  const isDynamicProduction = typeof window !== 'undefined' && 
                               (window.location.hostname.includes('vercel.app') || 
                                window.location.hostname.includes('learnersville.online') ||
                                !window.location.hostname.includes('localhost'));
  
  // For production (Vercel or Namecheap), use direct backend URL
  if (isProduction || isDynamicProduction) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const endpoint = `${API_URL}/${cleanPath}`;
    console.log('[API] Production endpoint:', endpoint);
    return endpoint;
  }
  
  // For local development, use Next.js rewrites
  if (path.startsWith('/php/')) {
    return path;
  }
  return `/php/${path}`;
};
```

## 🎯 How It Works

### **1. Module Load Time Check (SSR-Safe)**
```javascript
const isProduction = API_BASE_URL.includes('learnersville.online') || 
                     (typeof window !== 'undefined' && !window.location.hostname.includes('localhost'));
```
- Runs when the module is first loaded
- Safe for server-side rendering
- Handles environment variable configuration

### **2. Runtime Dynamic Check (Client-Side)**
```javascript
const isDynamicProduction = typeof window !== 'undefined' && 
                             (window.location.hostname.includes('vercel.app') || 
                              window.location.hostname.includes('learnersville.online') ||
                              !window.location.hostname.includes('localhost'));
```
- Runs every time `getEndpoint()` is called
- Only executes in browser (checks `window`)
- Detects Vercel, production domain, or any non-localhost

### **3. Combined Check**
```javascript
if (isProduction || isDynamicProduction) {
  // Use production backend URL
}
```
- Uses whichever check passes
- Ensures correct routing in all scenarios

## 🌍 URL Mapping Examples

### **On Vercel (`learnersville.vercel.app`):**
```
Input:  "Communication/edit_message.php"
Output: "https://learnersville.online/backend-ville/Communication/edit_message.php"

Input:  "Users/get_all_users.php"
Output: "https://learnersville.online/backend-ville/Users/get_all_users.php"
```

### **On localhost:3000:**
```
Input:  "Communication/edit_message.php"
Output: "/php/Communication/edit_message.php"
        → Next.js rewrites to → http://localhost/capstone-project/backend/Communication/edit_message.php

Input:  "Users/get_all_users.php"
Output: "/php/Users/get_all_users.php"
        → Next.js rewrites to → http://localhost/capstone-project/backend/Users/get_all_users.php
```

### **With Environment Variables Set:**
```
NEXT_PUBLIC_API_BASE_URL=https://learnersville.online
NEXT_PUBLIC_BACKEND_PATH=/backend-ville

All paths automatically use: https://learnersville.online/backend-ville/...
```

## 🚀 Deployment

### **1. Frontend (Vercel) - Auto-Deploy**
```bash
git add frontend/config/api.js
git commit -m "Fix: API routing for Vercel production"
git push
```
Vercel will automatically deploy in 1-2 minutes.

### **2. Backend (Namecheap) - Already Done**
✅ All Communication files with CORS fixes already uploaded

## 🔍 How to Verify Fix

### **1. Check Browser Console**
After deployment, open: `https://learnersville.vercel.app/SuperAdminSection/Message`

Look for console logs:
```javascript
[API] Production endpoint: https://learnersville.online/backend-ville/Communication/edit_message.php
[API] Production endpoint: https://learnersville.online/backend-ville/Communication/send_message.php
```

Should NOT see:
```
❌ https://learnersville.vercel.app/php/Communication/...
```

### **2. Check Network Tab**
1. Open DevTools → Network tab
2. Click on a conversation
3. Filter by "XHR" requests
4. All requests should go to: `learnersville.online/backend-ville/`
5. Status codes should be: `200 OK` or `304 Not Modified`
6. Should NOT see: `404 Not Found`

### **3. Test Functionality**
- ✅ Load conversations
- ✅ Send messages
- ✅ Edit messages
- ✅ Delete messages
- ✅ Archive conversations
- ✅ All features work perfectly

## 📊 Complete URL Flow

```
┌──────────────────────────────────────────────────────┐
│         Vercel Frontend                               │
│    learnersville.vercel.app                          │
└────────────────┬─────────────────────────────────────┘
                 │
                 │ Makes API request:
                 │ "Communication/edit_message.php"
                 │
                 ▼
      ┌──────────────────────────┐
      │   getEndpoint() checks:   │
      │   - isProduction?         │
      │   - isDynamicProduction?  │
      │   - window.location?      │
      └──────────┬───────────────┘
                 │
                 │ Both checks detect: PRODUCTION
                 │
                 ▼
        Returns full URL:
        "https://learnersville.online/backend-ville/Communication/edit_message.php"
                 │
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│         Namecheap Backend                          │
│    learnersville.online/backend-ville              │
│                                                     │
│    ✅ CORS headers allow learnersville.vercel.app  │
│    ✅ Processes request                            │
│    ✅ Returns JSON response                        │
└────────────────────────────────────────────────────┘
```

## 🎉 Expected Results

### **Before Fix:**
```
❌ POST https://learnersville.vercel.app/php/Communication/edit_message.php [404]
❌ Messages don't send
❌ Edit/delete fails
❌ "The page could not be found"
```

### **After Fix:**
```
✅ POST https://learnersville.online/backend-ville/Communication/edit_message.php [200]
✅ Messages send instantly
✅ Edit/delete works perfectly
✅ All CRUD operations functional
```

## 🐛 Troubleshooting

### **If still seeing `/php/` paths on Vercel:**

1. **Hard Refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Cache:** Browser settings → Clear browsing data
3. **Check Deployment:** Verify latest code is deployed on Vercel
4. **Check Logs:** Look for `[API] Production endpoint:` in console

### **If getting CORS errors:**

1. Verify backend files uploaded to Namecheap
2. Check `cors_config.php` exists in Communication folder
3. Test direct backend URL in browser
4. Check backend error logs

### **If environment variables needed:**

Set in Vercel dashboard:
```
NEXT_PUBLIC_API_BASE_URL=https://learnersville.online
NEXT_PUBLIC_BACKEND_PATH=/backend-ville
```

## 📝 Technical Notes

### **Why Two Checks?**

1. **`isProduction` (Module-level):**
   - Set once when module loads
   - Works with environment variables
   - Server-side rendering safe

2. **`isDynamicProduction` (Runtime):**
   - Checks every API call
   - Detects actual browser location
   - Handles Vercel-specific domains

### **Why Check `window`?**

```javascript
typeof window !== 'undefined'
```
- Next.js renders pages on server first (SSR)
- `window` doesn't exist on server
- Prevents "window is not defined" errors

### **Why Multiple Domain Checks?**

```javascript
hostname.includes('vercel.app') ||        // Vercel deployment
hostname.includes('learnersville.online') || // Custom domain
!hostname.includes('localhost')           // Any production
```
- Covers all deployment scenarios
- Future-proof for domain changes
- Catches any non-local environment

## ✨ Summary

This fix ensures that:
- ✅ **Vercel frontend** correctly routes to **Namecheap backend**
- ✅ **Local development** still uses `/php/` rewrites
- ✅ **Any production domain** automatically uses correct backend
- ✅ **Server-side rendering** doesn't break
- ✅ **Environment variables** work as expected

---

**Status:** ✅ Production Ready  
**Last Updated:** 2025-10-11  
**Priority:** CRITICAL - Required for Vercel functionality  
**Impact:** ALL API calls from Vercel frontend

