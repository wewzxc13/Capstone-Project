# 🚀 Production Deployment Checklist

## Quick Deploy Guide - Backend-Ville + Vercel Frontend

This checklist ensures your full-stack app works correctly on production.

---

## 📦 Part 1: Backend (Namecheap Server)

### Step 1: Upload Updated Files

Upload these files to `https://learnersville.online/backend-ville/`:

```
✅ config.php              (NEW - Environment & CORS config)
✅ connection.php          (UPDATED - Uses config.php)
✅ login.php               (UPDATED - Fixed debug bug)
✅ ENV_EXAMPLE.txt         (UPDATED - Vercel instructions)
```

### Step 2: Create .env File

**⚠️ CRITICAL:** Create a `.env` file on the server:

#### Via cPanel File Manager:
1. Go to **File Manager**
2. Navigate to `public_html/backend-ville/`
3. Click **+ File** → name it `.env`
4. Edit the file and add:

```env
# Database Configuration (GET FROM cPanel → MySQL® Databases)
DB_HOST=localhost
DB_NAME=your_cpanel_prefix_dblearnsville
DB_USER=your_cpanel_prefix_dbuser
DB_PASS=your_actual_database_password

# Environment
ENVIRONMENT=production

# CORS - Add your Vercel URL
CORS_ORIGIN=https://your-app.vercel.app,https://learnersville.online,http://localhost:3000
```

**Replace:**
- `your_cpanel_prefix` with your actual cPanel username
- `your_actual_database_password` with your database password
- `your-app.vercel.app` with your actual Vercel URL

#### Via FTP (FileZilla):
1. Connect to server
2. Navigate to `backend-ville/`
3. Right-click → **Create file** → name it `.env`
4. Edit and add configuration above

### Step 3: Set File Permissions

Set `.env` permissions to **600**:
- FileZilla: Right-click → File Permissions → `600`
- cPanel: Right-click → Change Permissions → `600`

### Step 4: Test Backend

Visit these URLs to verify:

1. **Health Check:**
   ```
   https://learnersville.online/backend-ville/health_check.php
   ```
   Expected: `{"status":"success","message":"API is running..."}`

2. **Check Active Users:**
   ```
   https://learnersville.online/backend-ville/test_credentials.php
   ```
   Expected: Shows list of active users
   **⚠️ DELETE THIS FILE AFTER TESTING!**

---

## 🌐 Part 2: Frontend (Vercel)

### Step 1: Get Your Vercel URL

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Copy the production URL (e.g., `capstone-project.vercel.app`)

### Step 2: Update Backend .env

Add your Vercel URL to the `.env` file on your server:

```env
CORS_ORIGIN=https://capstone-project.vercel.app,https://learnersville.online,http://localhost:3000
```

**Important:** 
- No spaces after commas!
- Include `https://`
- Use your actual Vercel URL

### Step 3: Configure Frontend Environment

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_API_BASE_URL=https://learnersville.online
NEXT_PUBLIC_BACKEND_PATH=/backend-ville
```

3. Redeploy your frontend

### Step 4: Test Frontend

1. Visit your Vercel deployment
2. Open browser console (F12)
3. Try to log in
4. Check for errors

---

## ✅ Testing Checklist

### Backend Tests:

- [ ] `health_check.php` returns success
- [ ] `test_credentials.php` shows active users
- [ ] `.env` file exists and has correct credentials
- [ ] `.env` permissions set to 600
- [ ] Database connection works

### Frontend Tests:

- [ ] Vercel deployment loads
- [ ] No CORS errors in console
- [ ] Can reach backend API
- [ ] Login form appears
- [ ] Can submit login (even if credentials wrong)

### Integration Tests:

- [ ] Login with valid credentials succeeds
- [ ] Invalid credentials show error message
- [ ] No 500 errors in network tab
- [ ] User redirects to correct dashboard
- [ ] All API calls work

---

## 🐛 Troubleshooting

### Issue: CORS Error on Vercel

**Error:** `CORS header 'Access-Control-Allow-Origin' does not match`

**Solution:**
1. ✓ Upload updated `config.php` to server
2. ✓ Add Vercel URL to `.env` CORS_ORIGIN
3. ✓ Clear browser cache
4. ✓ Hard refresh (Ctrl+Shift+R)

### Issue: 500 Internal Server Error

**Solution:**
1. ✓ Check `.env` file exists on server
2. ✓ Verify .env syntax (no quotes, no spaces around =)
3. ✓ Check `backend-ville/error_log.txt` for details
4. ✓ Verify database credentials in phpMyAdmin

### Issue: 401 Unauthorized (Valid Credentials)

**Solution:**
1. ✓ Check user exists in `tbl_users` table
2. ✓ Verify `user_status = 'Active'`
3. ✓ Password must be hashed (use `test_password_hash.php`)
4. ✓ Email must match exactly (case-sensitive)

### Issue: Database Connection Failed

**Solution:**
1. ✓ Test credentials in phpMyAdmin first
2. ✓ Verify DB_HOST is `localhost` (not 127.0.0.1)
3. ✓ Check DB_NAME includes cPanel prefix
4. ✓ Ensure database user has ALL PRIVILEGES

---

## 🔐 Security Checklist

After deployment:

- [ ] Delete `test_credentials.php` from server
- [ ] Delete `test_password_hash.php` from server
- [ ] `.env` permissions set to 600
- [ ] Never commit `.env` to git
- [ ] Database passwords are strong (16+ chars)
- [ ] CORS_ORIGIN doesn't include `*` in production

---

## 📁 Files to Clean Up (After Testing)

**DELETE these from production server:**

```
❌ backend-ville/test_credentials.php      (Shows database info)
❌ backend-ville/test_password_hash.php    (Generates password hashes)
```

Keep these:
```
✅ backend-ville/health_check.php          (Safe to keep - doesn't expose data)
```

---

## 🎯 Expected Results

### Successful Deployment:

| Test | Expected Result |
|------|----------------|
| Visit Vercel URL | ✅ Site loads |
| Login with valid creds | ✅ Redirects to dashboard |
| Login with invalid creds | ✅ Shows error message |
| Network tab | ✅ No 500 errors |
| Console | ✅ No CORS errors |
| Backend health check | ✅ Returns success |

### Normal Errors (These are OK):

| Error | Meaning |
|-------|---------|
| 401 Unauthorized | Wrong credentials (expected!) |
| "Invalid credentials" toast | Login validation working correctly |
| "Too many attempts" | Rate limiting working |

### Bad Errors (Need to Fix):

| Error | Problem |
|-------|---------|
| 500 Internal Server Error | Backend code crash |
| CORS error | Missing/wrong origin config |
| Network failed | Backend not reachable |
| Database connection failed | Wrong .env credentials |

---

## 📞 Need Help?

### Documentation Files:

1. **`VERCEL_CORS_FIX.md`** - Detailed CORS troubleshooting
2. **`BACKEND_VILLE_FIX_SUMMARY.md`** - Complete fix summary
3. **`backend-ville/SETUP_INSTRUCTIONS.md`** - Backend setup guide
4. **`backend-ville/PRODUCTION_DEPLOYMENT.md`** - Deployment checklist

### Check Logs:

- Backend errors: `backend-ville/error_log.txt`
- Server logs: cPanel → Error Log
- Browser console: F12 → Console tab
- Network requests: F12 → Network tab

---

## ✅ Final Verification

Once everything is deployed:

1. ✅ Visit your Vercel URL
2. ✅ Open browser console (F12)
3. ✅ Try to log in
4. ✅ Check network tab for API calls
5. ✅ Verify no CORS or 500 errors
6. ✅ Confirm login works with valid credentials

**If all checks pass: 🎉 DEPLOYMENT SUCCESSFUL!**

---

**Created:** October 11, 2025  
**Last Updated:** October 11, 2025  
**Status:** ✅ Ready for Production

