# Quick Deploy - Image Upload Fix

## What Was Fixed
User profile images were showing 404 errors. Now they load correctly from the backend server.

---

## Files to Upload

### 1. Upload to Namecheap

**File to upload:**
```
backend-ville/Uploads/.htaccess
```

**Upload location:**
```
/public_html/backend-ville/Uploads/.htaccess
```

**How to upload:**

### Option A: cPanel File Manager
1. Login to cPanel
2. Go to File Manager
3. Navigate to `/public_html/backend-ville/Uploads/`
4. Upload `.htaccess` (overwrite if it exists)
5. Set permissions: 644

### Option B: FTP
1. Connect via FileZilla
2. Navigate to `/public_html/backend-ville/Uploads/`
3. Upload `.htaccess` from your local `backend-ville/Uploads/.htaccess`
4. Overwrite when prompted

---

## Frontend Deployment

Push to GitHub (Vercel will auto-deploy):

```bash
git add frontend/config/api.ts
git commit -m "fix: Image uploads now load from backend server"
git push origin main
```

Wait 2-3 minutes for Vercel to build and deploy.

---

## Test Immediately

1. **Clear browser cache** (IMPORTANT!)
   - Press `Ctrl + Shift + Delete`
   - Clear "Cached images and files"
   - Click "Clear data"

2. **Visit Users page:**
   ```
   https://learnersville.vercel.app/SuperAdminSection/Users
   ```

3. **Check images:**
   - User profile pictures should display
   - No broken image icons
   - No 404 errors in Network tab (F12)

4. **Verify image URLs:**
   - Open Network tab (F12)
   - Look at image requests
   - Should load from: `https://learnersville.online/backend-ville/Uploads/`
   - NOT from: `https://learnersville.vercel.app/php/Uploads/`

---

## Expected Results

### Before Fix ❌
```
URL: https://learnersville.vercel.app/php/Uploads/img_6ciqp_Ellipse_5.png
Status: 404 Not Found
Result: Broken images
```

### After Fix ✅
```
URL: https://learnersville.online/backend-ville/Uploads/img_6ciqp_Ellipse_5.png
Status: 200 OK
Result: Images display correctly
```

---

## Quick Troubleshooting

### Images still 404?

1. **Verify .htaccess was uploaded:**
   ```
   Visit: https://learnersville.online/backend-ville/Uploads/.htaccess
   Should download the file (not 404)
   ```

2. **Clear ALL caches:**
   - Browser cache
   - Hard refresh: `Ctrl + Shift + R`

3. **Check Vercel deployed:**
   - Visit Vercel dashboard
   - Verify latest deployment succeeded

### Images load from wrong URL?

Check console (F12) for logs:
```
Should see: [API] Production endpoint: https://learnersville.online/backend-ville/...
```

If not, wait for Vercel deployment to complete.

---

## Files Changed

### Backend (1 file)
- ✅ `backend-ville/Uploads/.htaccess` - Enhanced CORS & caching

### Frontend (1 file)  
- ✅ `frontend/config/api.ts` - Production URL support

---

## Summary

✅ Upload 1 file to Namecheap
✅ Push frontend to GitHub  
✅ Clear browser cache
✅ Test images load

**Total time:** ~5 minutes

See `IMAGE_UPLOADS_FIX_SUMMARY.md` for detailed explanation.

