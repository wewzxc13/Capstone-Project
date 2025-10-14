# Backend-Ville Setup Instructions

## 🚀 Production Deployment Setup

This guide will help you set up the backend-ville folder on your production server (learnersville.online).

---

## ⚠️ CRITICAL: Create .env File on Server

The backend will **NOT work** without a properly configured `.env` file on your server.

### Step 1: Create the .env file

1. Connect to your server via **FTP** (FileZilla) or **cPanel File Manager**
2. Navigate to the `backend-ville` folder
3. Create a new file named `.env` (exactly, with no extension)

### Step 2: Configure Database Credentials

Get your database credentials from cPanel:
- Go to **cPanel → MySQL® Databases**
- Look for your database details

### Step 3: Add Configuration to .env

Copy the template below and **replace with your actual values**:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=your_cpanel_username_dblearnsville
DB_USER=your_cpanel_username_dbuser
DB_PASS=your_actual_database_password

# Environment
ENVIRONMENT=production

# CORS Configuration (Frontend URL)
CORS_ORIGIN=http://localhost:3000,https://learnersville.online
```

### Example .env (with sample values):

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=learn123_dblearnsville
DB_USER=learn123_dbuser
DB_PASS=MySecureP@ssw0rd123!

# Environment
ENVIRONMENT=production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://learnersville.online
```

---

## 🔒 Security Checklist

✅ **Set .env file permissions to 600** (read/write for owner only)
   - In FileZilla: Right-click → File Permissions → Set to `600`
   - In cPanel File Manager: Right-click → Change Permissions → Set to `600`

✅ **Never commit .env to Git** (it's already in .gitignore)

✅ **Use strong passwords** (minimum 16 characters with mixed case, numbers, symbols)

✅ **Different credentials for dev/prod** (never use production credentials locally)

---

## 🧪 Testing the Setup

After creating the .env file, test the connection:

1. Visit: `https://learnersville.online/backend-ville/health_check.php`
2. You should see: `{"status":"ok","database":"connected"}`
3. If you see an error, check your .env configuration

---

## 🐛 Troubleshooting

### Error: "Database connection failed"
- ✓ Check DB_HOST is "localhost" (not 127.0.0.1)
- ✓ Verify database user has ALL PRIVILEGES
- ✓ Ensure database name includes your cPanel prefix
- ✓ Test credentials in phpMyAdmin

### Error: "CORS error" / "Access denied"
- ✓ Check CORS_ORIGIN matches your frontend URL exactly
- ✓ Include protocol (http:// or https://)
- ✓ For multiple origins, separate with commas (no spaces)
- ✓ Clear browser cache and try again

### Error: "500 Internal Server Error"
- ✓ Make sure .env file exists in backend-ville folder
- ✓ Check .env file has correct syntax (KEY=VALUE, no spaces around =)
- ✓ Verify file permissions are set correctly
- ✓ Check error_log.txt for detailed error messages

---

## 📁 Required Files on Server

Make sure these files are uploaded:

```
backend-ville/
├── .env                    ← YOU MUST CREATE THIS!
├── config.php              ← Loads environment variables
├── connection.php          ← Database connection
├── login.php               ← Login endpoint
├── ENV_EXAMPLE.txt         ← Reference template
└── ... (all other files)
```

---

## 🎯 Quick Start Checklist

- [ ] Upload all backend-ville files to server
- [ ] Create .env file with actual credentials
- [ ] Set .env permissions to 600
- [ ] Test health_check.php endpoint
- [ ] Test login.php endpoint
- [ ] Verify logs are being created

---

## 📞 Need Help?

If you're still having issues after following this guide:

1. Check `backend-ville/error_log.txt` for error messages
2. Verify database credentials in phpMyAdmin
3. Test database connection in phpMyAdmin first
4. Make sure PHP version is 7.4 or higher

---

**Last Updated:** October 11, 2025

