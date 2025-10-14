# 🚀 Production Deployment Guide - Backend-Ville

## What Was Fixed

The 500 Internal Server Error was caused by two issues:

### 1. **Debug Logging Bug** ✅ FIXED
   - Fixed undefined variable error in `login.php`
   - Updated line 140 to check if `$user` exists before accessing its properties

### 2. **Missing Environment Configuration** ✅ FIXED
   - Added `config.php` for environment variable loading
   - Updated `connection.php` to use environment-based credentials
   - Created `ENV_EXAMPLE.txt` as a template

---

## 📋 Action Required on Production Server

### STEP 1: Upload Files

Upload these **NEW** files to your server at `https://learnersville.online/backend-ville/`:

```
✅ config.php           (NEW - Environment loader)
✅ connection.php       (UPDATED - Uses config.php now)
✅ login.php            (UPDATED - Fixed debug bug)
✅ ENV_EXAMPLE.txt      (NEW - Configuration template)
✅ SETUP_INSTRUCTIONS.md (NEW - Detailed setup guide)
```

### STEP 2: Create .env File on Server

**⚠️ CRITICAL:** You MUST create a `.env` file on the production server with your actual database credentials.

#### Via cPanel File Manager:
1. Log into cPanel
2. Go to **File Manager**
3. Navigate to `public_html/backend-ville/`
4. Click **+ File**
5. Name it `.env` (exactly, with the dot)
6. Right-click the file → **Edit**
7. Add your configuration (see template below)

#### Via FTP (FileZilla):
1. Connect to your server
2. Navigate to `backend-ville/`
3. Right-click in file list → **Create file**
4. Name it `.env`
5. Right-click `.env` → **View/Edit**
6. Add your configuration (see template below)

---

## 🔐 .env File Template

**Get your database credentials from cPanel → MySQL® Databases**

```env
# Production Database Configuration
DB_HOST=localhost
DB_NAME=your_cpanel_username_dblearnsville
DB_USER=your_cpanel_username_dbuser
DB_PASS=your_actual_database_password

# Environment Setting
ENVIRONMENT=production

# CORS - Frontend URLs (comma-separated, no spaces)
CORS_ORIGIN=http://localhost:3000,https://learnersville.online
```

### Real Example (with fake credentials):
```env
DB_HOST=localhost
DB_NAME=learn123_dblearnsville
DB_USER=learn123_admin
DB_PASS=Secure_P@ssw0rd_2024!
ENVIRONMENT=production
CORS_ORIGIN=http://localhost:3000,https://learnersville.online
```

---

## 🔒 Security: Set File Permissions

**Set .env file permissions to 600** (owner read/write only):

### In FileZilla:
1. Right-click `.env`
2. **File Permissions**
3. Set to `600` or check: ☑ Owner Read, ☑ Owner Write
4. Click **OK**

### In cPanel File Manager:
1. Right-click `.env`
2. **Change Permissions**
3. Set to `600`
4. Click **Change Permissions**

---

## ✅ Testing Your Setup

### Test 1: Database Connection
Visit: `https://learnersville.online/backend-ville/health_check.php`

**Expected Response:**
```json
{
  "status": "success",
  "message": "API is running and database is connected",
  "timestamp": "2025-10-11 16:15:30"
}
```

### Test 2: Login Endpoint
Try logging in from your frontend at `http://localhost:3000`

**Expected:** Login should work without 500 errors

---

## 🐛 Troubleshooting

### Still Getting 500 Error?

1. **Check if .env exists:**
   - Navigate to backend-ville folder
   - Look for `.env` file (may be hidden)
   - If not there, create it (see STEP 2 above)

2. **Check .env file contents:**
   - Open `.env` in text editor
   - Verify no syntax errors
   - Format: `KEY=VALUE` (no spaces around =)
   - No empty values

3. **Check database credentials:**
   - Log into phpMyAdmin
   - Try connecting with the same credentials
   - If phpMyAdmin fails, credentials are wrong

4. **Check file permissions:**
   - `.env` should be `600`
   - Other PHP files should be `644`

5. **Check error logs:**
   - Look at `backend-ville/error_log.txt`
   - Check cPanel error logs

---

## 📝 Local Development Setup

For local testing on your computer (XAMPP):

1. Open `backend-ville/` in your local project
2. Create a `.env` file with:
   ```env
   DB_HOST=localhost
   DB_NAME=dblearnsville
   DB_USER=root
   DB_PASS=
   ENVIRONMENT=development
   CORS_ORIGIN=http://localhost:3000
   ```

3. Your local backend should now work at `http://localhost/capstone-project/backend-ville/`

---

## 📞 Common Error Messages & Solutions

| Error Message | Solution |
|--------------|----------|
| "Database connection failed" | Check DB credentials in .env |
| "CORS error" | Update CORS_ORIGIN in .env |
| "500 Internal Server Error" | Check if .env file exists |
| "Access denied for user" | Verify database user permissions |
| "Unknown database" | Check DB_NAME includes cPanel prefix |

---

## 🎯 Quick Checklist

- [ ] Uploaded all updated files to server
- [ ] Created `.env` file on server
- [ ] Added correct database credentials to `.env`
- [ ] Set CORS_ORIGIN in `.env`
- [ ] Set `.env` permissions to 600
- [ ] Tested health_check.php (returns success)
- [ ] Tested login from frontend (no 500 error)
- [ ] Verified system logs are working

---

## 📚 Additional Resources

- **Full Setup Guide:** `SETUP_INSTRUCTIONS.md`
- **Environment Template:** `ENV_EXAMPLE.txt`
- **Database Health Check:** `health_check.php`

---

**Need Help?** 
- Check error logs: `backend-ville/error_log.txt`
- Verify PHP version: PHP 7.4+ required
- Test in phpMyAdmin first

---

**Status:** ✅ Code fixed, deployment configuration ready
**Last Updated:** October 11, 2025

