# ⚡ Quick Deploy: Backend to Namecheap

## 5-Minute Setup Guide

### 1️⃣ Database Setup (cPanel)
```
1. MySQL® Databases → Create Database
2. Create user + Generate password
3. Add user to database (ALL PRIVILEGES)
4. phpMyAdmin → Import → Select database/dblearnsville.sql
```

### 2️⃣ Create .env File
```env
DB_HOST=localhost
DB_NAME=cpanel_username_dblearnsville
DB_USER=cpanel_username_dbuser
DB_PASS=your_password
ENVIRONMENT=production
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 3️⃣ Upload Files (FileZilla)
```
Host: ftp.yourdomain.com
Username: Your cPanel FTP username
Password: Your cPanel FTP password
Port: 21

Upload to: /public_html/backend-ville/
```

### 4️⃣ Set Permissions
```
Folders: 755
Files: 644
.env: 600
Uploads/: 755
SystemLogs/: 755
```

### 5️⃣ Test Backend
```
Visit: https://yourdomain.com/backend-ville/health_check.php
Expected: Success message
```

## Common Commands

### FTP Upload (Terminal)
```bash
# If using lftp
lftp ftp://username:password@yourdomain.com
cd public_html
mkdir backend-ville
mirror -R /local/path/backend /public_html/backend-ville
```

### Composer (SSH)
```bash
cd /home/username/public_html/backend-ville
composer install --no-dev --optimize-autoloader
```

### Set Permissions (SSH)
```bash
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 Uploads/ SystemLogs/
chmod 600 .env
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| Database connection failed | Check .env credentials, verify DB user privileges |
| CORS error | Update CORS_ORIGIN in .env with Vercel URL |
| 500 error | Check error logs in SystemLogs/error_log.txt |
| File upload fails | Verify Uploads/ folder is 755 |

## Security Checklist
- [ ] .env file uploaded and secured
- [ ] HTTPS enabled
- [ ] Debug files removed
- [ ] Error logging enabled
- [ ] File permissions correct
- [ ] Strong database password

## URLs to Remember
- **cPanel:** yourdomain.com/cpanel
- **phpMyAdmin:** Via cPanel
- **FTP:** ftp.yourdomain.com
- **Backend:** https://yourdomain.com/backend-ville/
- **Health Check:** https://yourdomain.com/backend-ville/health_check.php

