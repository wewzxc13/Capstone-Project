# Image Uploads 404 Fix Summary

## Issue
User profile images were returning 404 errors because they were trying to load from Vercel instead of the backend server where images are actually stored.

### Error Details
```
GET https://learnersville.vercel.app/php/Uploads/img_6ciqp_Ellipse_5.png
Status: 404 Not Found
```

### Root Cause
The `uploadsAPI.getUploadURL()` function in `api.ts` was always returning `/php/Uploads/` which works locally (via Next.js rewrites) but fails in production because:
- Vercel hosts only the frontend (no backend files)
- Images are stored on Namecheap backend server
- Production needs full backend URL: `https://learnersville.online/backend-ville/Uploads/`

---

## Solution

### 1. Fixed Upload URL Configuration

**File**: `frontend/config/api.ts`

**Before:**
```typescript
export const uploadsAPI = {
  getUploadURL: (filename: string) => `/php/Uploads/${filename}`,
  // ...
};
```

**After:**
```typescript
export const uploadsAPI = {
  getUploadURL: (filename: string) => {
    // For production, use direct backend URL
    if (isProduction) {
      return `${API_URL}/Uploads/${filename}`;
    }
    // For local development, use Next.js rewrite
    return `/php/Uploads/${filename}`;
  },
  // ...
};
```

**Result:**
- ✅ Production: `https://learnersville.online/backend-ville/Uploads/img_6ciqp_Ellipse_5.png`
- ✅ Local Dev: `/php/Uploads/img_6ciqp_Ellipse_5.png` (rewritten to localhost backend)

### 2. Enhanced CORS Configuration for Images

**Files Updated:**
- `backend-ville/Uploads/.htaccess`
- `backend/Uploads/.htaccess`

**Changes:**
- ✅ Replaced wildcard CORS (`*`) with specific allowed origins
- ✅ Added support for production domains
- ✅ Added support for all Vercel deployments
- ✅ Added caching headers for better performance
- ✅ Secure origin validation

**New Configuration:**
```apache
# Check if origin matches allowed patterns
SetEnvIf Origin "^https://learnersville\.online$" AccessControlAllowOrigin=$0
SetEnvIf Origin "^https://www\.learnersville\.online$" AccessControlAllowOrigin=$0
SetEnvIf Origin "^https://.*\.vercel\.app$" AccessControlAllowOrigin=$0
SetEnvIf Origin "^http://localhost:3[0-9]{3,}$" AccessControlAllowOrigin=$0

# Set CORS headers dynamically
Header set Access-Control-Allow-Origin "%{AccessControlAllowOrigin}e" env=AccessControlAllowOrigin

# Cache images for 1 year
Header set Cache-Control "public, max-age=31536000"
```

---

## Files Modified

### Frontend
1. ✅ `frontend/config/api.ts`
   - Updated `uploadsAPI.getUploadURL()` to handle production URLs
   - Added environment detection

### Backend
2. ✅ `backend-ville/Uploads/.htaccess`
   - Enhanced CORS configuration
   - Added caching headers
   - Secure origin validation

3. ✅ `backend/Uploads/.htaccess`
   - Same configuration for local development consistency

---

## Deployment Instructions

### Step 1: Upload Backend Files

Upload the `.htaccess` file to Namecheap:

**Via cPanel File Manager:**
1. Login to cPanel
2. Navigate to `/public_html/backend-ville/Uploads/`
3. Upload `.htaccess` (overwrite existing)
4. Set permissions: 644

**Via FTP:**
```
Upload: backend-ville/Uploads/.htaccess
To:     /public_html/backend-ville/Uploads/.htaccess
```

### Step 2: Deploy Frontend (Automatic)

Push changes to trigger Vercel deployment:
```bash
git add frontend/config/api.ts
git commit -m "fix: Image uploads now load from backend server in production"
git push origin main
```

### Step 3: Test

1. **Clear Browser Cache** (Important!)
   - Ctrl+Shift+Delete
   - Clear cached images and files

2. **Visit Users Page**
   - https://learnersville.vercel.app/SuperAdminSection/Users

3. **Verify Images Load**
   - User profile pictures should display
   - No 404 errors in Network tab (F12)
   - Images load from `learnersville.online` not `vercel.app`

---

## Expected Results

### Before Fix
- ❌ Images: 404 Not Found
- ❌ URL: `https://learnersville.vercel.app/php/Uploads/img_6ciqp_Ellipse_5.png`
- ❌ Broken profile pictures
- ❌ Default placeholder icons

### After Fix
- ✅ Images: 200 OK
- ✅ URL: `https://learnersville.online/backend-ville/Uploads/img_6ciqp_Ellipse_5.png`
- ✅ Profile pictures display correctly
- ✅ Cached for better performance
- ✅ Secure CORS validation

---

## How It Works

### Production Environment
1. Frontend checks: `isProduction = true`
2. Calls: `uploadsAPI.getUploadURL('img_6ciqp_Ellipse_5.png')`
3. Returns: `https://learnersville.online/backend-ville/Uploads/img_6ciqp_Ellipse_5.png`
4. Browser requests image from backend server
5. `.htaccess` validates origin and allows access
6. Image served with CORS headers + cache headers

### Local Development
1. Frontend checks: `isProduction = false`
2. Calls: `uploadsAPI.getUploadURL('img_6ciqp_Ellipse_5.png')`
3. Returns: `/php/Uploads/img_6ciqp_Ellipse_5.png`
4. Next.js rewrites to: `http://localhost/capstone-project/backend/Uploads/img_6ciqp_Ellipse_5.png`
5. Image served from local XAMPP server

---

## Troubleshooting

### Images Still 404

1. **Check .htaccess was uploaded**
   ```
   Visit: https://learnersville.online/backend-ville/Uploads/.htaccess
   Should download or show content (not 404)
   ```

2. **Verify image exists on server**
   ```
   Check: /public_html/backend-ville/Uploads/img_6ciqp_Ellipse_5.png
   ```

3. **Clear ALL caches**
   - Browser cache
   - Vercel deployment cache (redeploy)
   - CDN cache if applicable

### Images Load from Wrong URL

1. **Check environment detection**
   - Open Console (F12)
   - Look for `[API] Production endpoint:` logs
   - Should show `learnersville.online` URLs

2. **Verify Vercel deployment**
   - Ensure latest code is deployed
   - Check Vercel dashboard for successful build

### CORS Errors

1. **Check .htaccess syntax**
   - Ensure no typos in regex patterns
   - Verify Apache modules enabled: `mod_headers`, `mod_setenvif`

2. **Test direct image access**
   ```
   Visit: https://learnersville.online/backend-ville/Uploads/img_6ciqp_Ellipse_5.png
   Should display image (not download or error)
   ```

3. **Check server error logs**
   - cPanel → Error Logs
   - Look for `.htaccess` syntax errors

---

## Performance Benefits

### Caching Headers Added
```apache
Header set Cache-Control "public, max-age=31536000"
```

**Benefits:**
- ✅ Images cached for 1 year
- ✅ Reduces server load
- ✅ Faster page loads
- ✅ Lower bandwidth usage
- ✅ Better user experience

### Expected Performance
- **First Load:** Image fetched from server
- **Subsequent Loads:** Image served from browser cache
- **Cache Duration:** 365 days
- **Re-validation:** On cache expiry or manual clear

---

## Security Improvements

### Before
```apache
Header set Access-Control-Allow-Origin "*"  # ❌ Allows ANY origin
```

### After
```apache
# ✅ Only allows specific origins
SetEnvIf Origin "^https://learnersville\.online$" AccessControlAllowOrigin=$0
SetEnvIf Origin "^https://www\.learnersville\.online$" AccessControlAllowOrigin=$0
SetEnvIf Origin "^https://.*\.vercel\.app$" AccessControlAllowOrigin=$0
```

**Security Benefits:**
- ✅ Prevents unauthorized access
- ✅ Blocks hotlinking from unknown sites
- ✅ Reduces bandwidth theft
- ✅ Better control over access

---

## Testing Checklist

After deployment:

### Users Page
- [ ] User profile pictures load
- [ ] Admin pictures display
- [ ] Teacher pictures display
- [ ] Parent pictures display
- [ ] Student pictures display
- [ ] No 404 errors in Network tab
- [ ] No CORS errors in Console

### Image URLs
- [ ] Images load from `learnersville.online` (not `vercel.app`)
- [ ] Image URLs include `/backend-ville/Uploads/`
- [ ] Direct image access works in browser

### Performance
- [ ] Images load quickly
- [ ] Second page load uses cached images
- [ ] Network tab shows "from cache" for repeat loads

### Different User Types
- [ ] Default avatars load (if no custom picture)
- [ ] Custom uploaded pictures load
- [ ] Pictures load for all roles

---

## Related Files

### Frontend
- `frontend/config/api.ts` - Upload URL configuration
- `frontend/app/SuperAdminSection/Users/page.js` - Uses upload URLs

### Backend
- `backend-ville/Uploads/.htaccess` - CORS & caching config
- `backend-ville/Uploads/` - Image storage directory
- `backend-ville/Users/upload_photo.php` - Image upload handler

### Documentation
- `IMAGE_UPLOADS_FIX_SUMMARY.md` - This file
- `COMPLETE_CORS_FIX_SUMMARY.md` - Overall CORS fixes

---

## Quick Reference

### Production Image URL Format
```
https://learnersville.online/backend-ville/Uploads/{filename}
```

### Local Development Image URL Format
```
/php/Uploads/{filename}
→ Rewritten to: http://localhost/capstone-project/backend/Uploads/{filename}
```

### Usage in Code
```typescript
import { API } from '@/config/api';

// Automatically handles production vs development
const imageUrl = API.uploads.getUploadURL('img_6ciqp_Ellipse_5.png');

// In JSX
<img src={imageUrl} alt="User photo" />
```

---

## Summary

✅ **Fixed image 404 errors**
✅ **Added production URL support**
✅ **Enhanced CORS security**
✅ **Added performance caching**
✅ **Maintained local development support**

**All user profile images should now load correctly in production!** 🎉

