# 🚀 Deployment Guide: Vercel (Frontend) & Namecheap (Backend)

## Table of Contents
1. [Backend Deployment (Namecheap)](#backend-deployment-namecheap)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Post-Deployment Configuration](#post-deployment-configuration)
4. [Troubleshooting](#troubleshooting)

---

## 📦 PART 1: Backend Deployment (Namecheap)

### Prerequisites
- ✅ Namecheap hosting account with cPanel access
- ✅ FTP/SFTP credentials (get from cPanel > FTP Accounts)
- ✅ MySQL database access
- ✅ Domain configured (e.g., learnersville.online)
- ✅ FileZilla or any FTP client installed

### Step 1: Create MySQL Database

1. **Login to cPanel** (usually at yourdomain.com/cpanel)
2. **Navigate to MySQL® Databases**
3. **Create a new database:**
   - Database name: `dblearnsville` (or your preferred name)
   - Click "Create Database"
4. **Create a database user:**
   - Username: Choose a secure username
   - Password: Generate a strong password
   - Click "Create User"
5. **Add user to database:**
   - Select the user and database
   - Grant ALL PRIVILEGES
   - Click "Make Changes"
6. **Note down these credentials:**
   ```
   DB_HOST: localhost
   DB_NAME: your_cpanel_username_dblearnsville
   DB_USER: your_cpanel_username_dbuser
   DB_PASS: your_secure_password
   ```

### Step 2: Import Database

1. **Go to phpMyAdmin** in cPanel
2. **Select your database** from the left sidebar
3. **Click "Import" tab**
4. **Choose file:** `database/dblearnsville.sql` from your project
5. **Click "Go"** to import
6. **Verify:** Check that all tables are created successfully

### Step 3: Prepare Backend Files

1. **Create a `.env` file in your backend folder:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_NAME=your_cpanel_username_dblearnsville
   DB_USER=your_cpanel_username_dbuser
   DB_PASS=your_secure_password

   # Environment
   ENVIRONMENT=production

   # CORS Configuration
   # Add your Vercel domain after frontend deployment
   CORS_ORIGIN=https://your-vercel-app.vercel.app

   # Multiple origins (comma-separated)
   # CORS_ORIGIN=https://your-vercel-app.vercel.app,https://learnersville.online
   ```

2. **Files to exclude from upload (already on server/not needed):**
   - `node_modules/` (if any)
   - `.git/`
   - `*.md` files (optional)
   - `debug_*.txt` files
   - `error_log.txt` files

### Step 4: Upload Backend Files via FTP

#### Using FileZilla:

1. **Open FileZilla**
2. **Connect to your server:**
   - Host: `ftp.yourdomain.com` or your server IP
   - Username: Your cPanel FTP username
   - Password: Your cPanel FTP password
   - Port: 21 (or 22 for SFTP)

3. **Navigate to the web root:**
   - Usually: `/public_html/` or `/home/username/public_html/`

4. **Create backend folder:**
   - Create a folder named `backend-ville` (or your preferred name)
   - This will be accessible at: `https://yourdomain.com/backend-ville/`

5. **Upload all backend files:**
   - Select all files from your local `backend/` folder
   - Drag and drop to the `backend-ville` folder on the server
   - Wait for upload to complete (may take 5-15 minutes)

6. **Upload the `.env` file:**
   - Make sure the `.env` file is uploaded to `/public_html/backend-ville/.env`

#### Alternative: Using cPanel File Manager

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to:** `/public_html/`
4. **Create folder:** `backend-ville`
5. **Click "Upload"** and select your backend files
6. **Or use "Compress"** on local machine, upload ZIP, and extract on server

### Step 5: Set File Permissions

1. **In cPanel File Manager or via FTP:**
   - Set folders to `755` (rwxr-xr-x)
   - Set PHP files to `644` (rw-r--r--)
   - Set `.env` to `600` (rw-------) for security

2. **Important folders:**
   ```
   /backend-ville/Uploads/     → 755 (needs write permission)
   /backend-ville/SystemLogs/  → 755 (needs write permission)
   /backend-ville/.env         → 600 (read-only for owner)
   ```

3. **Set permissions using FileZilla:**
   - Right-click folder/file → File Permissions
   - Or use cPanel File Manager → Select file → Permissions

### Step 6: Configure PHP Settings (Optional)

1. **Create `.htaccess` file in `/backend-ville/`:**
   ```apache
   # Enable PHP error logging in production
   php_flag display_errors Off
   php_flag log_errors On
   php_value error_log /home/username/public_html/backend-ville/SystemLogs/error_log.txt

   # Set PHP memory and upload limits
   php_value upload_max_filesize 10M
   php_value post_max_size 10M
   php_value max_execution_time 300
   php_value max_input_time 300

   # Security headers
   Header set X-Content-Type-Options "nosniff"
   Header set X-Frame-Options "SAMEORIGIN"
   Header set X-XSS-Protection "1; mode=block"

   # CORS headers (if needed beyond PHP config)
   Header set Access-Control-Allow-Origin "*"
   Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
   Header set Access-Control-Allow-Headers "Content-Type, Authorization"
   ```

### Step 7: Install Composer Dependencies

1. **SSH into your server** (if SSH access is available):
   ```bash
   cd /home/username/public_html/backend-ville
   composer install --no-dev --optimize-autoloader
   ```

2. **If no SSH access:**
   - Install dependencies locally first
   - Upload the entire `vendor/` folder via FTP
   - Upload `composer.lock` file

### Step 8: Test Backend

1. **Test health check endpoint:**
   ```
   https://yourdomain.com/backend-ville/health_check.php
   ```
   Should return success message

2. **Test database connection:**
   ```
   https://yourdomain.com/backend-ville/connection.php
   ```
   (Create a temporary test file if needed)

3. **Check error logs:**
   - `/backend-ville/SystemLogs/error_log.txt`
   - Look for any database connection errors

### Step 9: Secure Your Backend

1. **Remove test files:**
   - Delete any `test_*.php` files
   - Delete `debug_*.txt` files
   - Delete `connection.php` if it's a test file

2. **Secure `.env` file:**
   ```apache
   # Add to .htaccess
   <Files ".env">
       Order allow,deny
       Deny from all
   </Files>
   ```

3. **Enable HTTPS:**
   - In cPanel, go to SSL/TLS Status
   - Enable AutoSSL or install Let's Encrypt certificate
   - Force HTTPS redirection in `.htaccess`:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

---

## 🌐 PART 2: Frontend Deployment (Vercel)

### Prerequisites
- ✅ Vercel account (free tier works perfectly)
- ✅ GitHub/GitLab account (recommended) or Vercel CLI
- ✅ Backend deployed and URL noted

### Method 1: Deploy via GitHub (Recommended)

#### Step 1: Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   ```

2. **Create GitHub repository:**
   - Go to github.com and create a new repository
   - Name it: `capstone-frontend` or your preferred name
   - Don't initialize with README (we already have code)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/yourusername/capstone-frontend.git
   git branch -M main
   git push -u origin main
   ```

#### Step 2: Connect to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "Add New Project"**
4. **Import your GitHub repository:**
   - Select your repository
   - Click "Import"

#### Step 3: Configure Project Settings

1. **Framework Preset:** Next.js (auto-detected)

2. **Root Directory:** `./` (or select frontend folder if repo has both frontend/backend)

3. **Build Settings:**
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Environment Variables:** Click "Add Environment Variable"
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
   NEXT_PUBLIC_BACKEND_PATH=/backend-ville
   ```

   **Important:** Replace with your actual domain!

5. **Node.js Version:**
   - Click "Advanced Build Settings"
   - Set Node.js Version: `18.x` or `20.x`

#### Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for build** (usually 2-5 minutes)
3. **Monitor build logs** for any errors
4. **Once complete**, you'll get a URL like:
   ```
   https://your-project-name.vercel.app
   ```

### Method 2: Deploy via Vercel CLI (Alternative)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

4. **Deploy:**
   ```bash
   vercel
   ```

5. **Follow prompts:**
   - Setup and deploy? Yes
   - Scope: Your account
   - Link to existing project? No
   - Project name: your-project-name
   - Directory: ./
   - Override settings? No

6. **Set environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_API_BASE_URL
   # Enter: https://yourdomain.com

   vercel env add NEXT_PUBLIC_BACKEND_PATH
   # Enter: /backend-ville
   ```

7. **Deploy to production:**
   ```bash
   vercel --prod
   ```

---

## 🔧 PART 3: Post-Deployment Configuration

### Step 1: Update Backend CORS

1. **Update backend `.env` file** with your Vercel URL:
   ```env
   CORS_ORIGIN=https://your-project-name.vercel.app
   ```

2. **For multiple domains:**
   ```env
   CORS_ORIGIN=https://your-project-name.vercel.app,https://yourdomain.com
   ```

3. **Re-upload `.env` file** to Namecheap via FTP

### Step 2: Test Complete Integration

1. **Open your Vercel app:**
   ```
   https://your-project-name.vercel.app
   ```

2. **Test key features:**
   - [ ] Login page loads
   - [ ] Can login with credentials
   - [ ] Dashboard loads properly
   - [ ] Images display correctly
   - [ ] API calls work (check browser console)

3. **Check browser console** (F12):
   - No CORS errors
   - No 404 errors
   - API responses are successful

### Step 3: Add Custom Domain (Optional)

#### For Vercel (Frontend):

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your domain: `app.yourdomain.com` or `www.yourdomain.com`

2. **Update DNS in Namecheap:**
   - Go to Namecheap → Domain List → Manage
   - Advanced DNS
   - Add CNAME record:
     - Type: CNAME Record
     - Host: app (or www)
     - Value: cname.vercel-dns.com
     - TTL: Automatic

3. **Wait for DNS propagation** (5 minutes to 48 hours)

### Step 4: Enable Analytics (Optional)

1. **Vercel Analytics:**
   - Go to project settings
   - Enable Vercel Analytics (free)
   - Monitor performance and usage

2. **Backend Monitoring:**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Monitor: `https://yourdomain.com/backend-ville/health_check.php`

---

## 🐛 PART 4: Troubleshooting

### Common Backend Issues

#### 1. Database Connection Failed
**Error:** "Could not connect to database"

**Solutions:**
- Verify database credentials in `.env`
- Check that database user has ALL PRIVILEGES
- Confirm database exists and is not empty
- Check `DB_HOST` is `localhost` (not 127.0.0.1)
- Look at error logs: `/backend-ville/SystemLogs/error_log.txt`

#### 2. CORS Errors
**Error:** "Access-Control-Allow-Origin" in browser console

**Solutions:**
- Update `CORS_ORIGIN` in backend `.env` with your Vercel URL
- Clear browser cache
- Check `config.php` is loading `.env` correctly
- Verify `.htaccess` CORS headers (if added)

#### 3. File Upload Errors
**Error:** "Failed to upload file"

**Solutions:**
- Check `Uploads/` folder permissions (755)
- Verify PHP upload limits in `.htaccess`
- Check disk space on hosting account
- Ensure folder exists and path is correct

#### 4. 500 Internal Server Error
**Error:** "Internal Server Error" on any PHP file

**Solutions:**
- Check PHP version (should be 7.4 or 8.x)
- Review error logs in cPanel or `SystemLogs/error_log.txt`
- Verify file permissions (644 for PHP files)
- Check for syntax errors in PHP files
- Ensure all required PHP extensions are enabled

#### 5. Composer Dependencies Missing
**Error:** "Class not found" errors

**Solutions:**
- Upload entire `vendor/` folder from local
- If SSH available, run `composer install`
- Check `autoload.php` is present
- Verify composer.json and composer.lock are uploaded

### Common Frontend Issues

#### 1. Build Fails on Vercel
**Error:** Build fails during deployment

**Solutions:**
- Check Node.js version (use 18.x or 20.x)
- Review build logs in Vercel dashboard
- Ensure `package.json` has all dependencies
- Try building locally first: `npm run build`
- Check for TypeScript errors (if using TS)

#### 2. API Calls Fail
**Error:** Network errors or 404s when calling API

**Solutions:**
- Verify environment variables in Vercel dashboard
- Check `NEXT_PUBLIC_API_BASE_URL` is correct (no trailing slash)
- Check `NEXT_PUBLIC_BACKEND_PATH` matches your backend folder
- Test backend URLs directly in browser
- Check CORS is configured correctly in backend

#### 3. Images Not Loading
**Error:** User photos or images show broken

**Solutions:**
- Verify upload folder path in `config/api.ts`
- Check image URLs in browser network tab
- Ensure `Uploads/` folder is uploaded to backend
- Check file permissions on server (755 for folders)
- Verify image paths in database

#### 4. Environment Variables Not Working
**Error:** Using wrong API URL or defaults

**Solutions:**
- Variables must start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding/changing variables
- Check variable names match exactly (case-sensitive)
- Don't use quotes in Vercel dashboard when entering values

#### 5. Routing Issues
**Error:** 404 on page refresh

**Solutions:**
- Vercel handles this automatically for Next.js
- If using custom server, ensure dynamic routes are configured
- Check `next.config.js` for proper rewrites/redirects

### Performance Issues

#### 1. Slow Page Load
**Solutions:**
- Enable Vercel Analytics to identify slow pages
- Optimize images (use Next.js Image component)
- Enable caching headers in backend `.htaccess`
- Consider CDN for uploads folder
- Minimize API calls on initial load

#### 2. Database Query Slow
**Solutions:**
- Add indexes to frequently queried columns
- Optimize SQL queries (avoid SELECT *)
- Enable MySQL query cache in cPanel
- Consider adding Redis cache (if available)

---

## 📋 Deployment Checklist

### Backend (Namecheap)
- [ ] Database created and imported
- [ ] `.env` file configured with correct credentials
- [ ] All backend files uploaded via FTP
- [ ] File permissions set correctly (755 folders, 644 files)
- [ ] Composer dependencies installed/uploaded
- [ ] Health check endpoint working
- [ ] CORS configured with Vercel URL
- [ ] HTTPS enabled and forced
- [ ] Error logging enabled
- [ ] Test files removed
- [ ] `.env` file secured in `.htaccess`

### Frontend (Vercel)
- [ ] Code pushed to GitHub (if using Git method)
- [ ] Project imported to Vercel
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Application accessible at Vercel URL
- [ ] Login functionality working
- [ ] API calls successful
- [ ] Images loading correctly
- [ ] No console errors
- [ ] Mobile responsive

### Final Testing
- [ ] Complete user flow tested (signup → login → dashboard)
- [ ] All user roles tested (admin, teacher, student, parent)
- [ ] File uploads working
- [ ] Messaging system working
- [ ] Assessment features working
- [ ] Schedule features working
- [ ] Notifications working
- [ ] Performance acceptable (< 3s load time)
- [ ] Browser console clean (no errors)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Mobile tested

---

## 🎉 Success!

Your application is now deployed!

**Frontend URL:** https://your-project-name.vercel.app
**Backend URL:** https://yourdomain.com/backend-ville/

### Next Steps:
1. Monitor error logs regularly
2. Set up automated backups for database
3. Configure SSL certificate renewal (auto with Let's Encrypt)
4. Set up monitoring/alerts for uptime
5. Document any custom configurations
6. Train users on the system

### Support Resources:
- **Vercel Docs:** https://vercel.com/docs
- **Namecheap Support:** https://www.namecheap.com/support/
- **Next.js Docs:** https://nextjs.org/docs
- **PHP Manual:** https://www.php.net/manual/

---

**Need Help?** Check error logs first, then consult the troubleshooting section above.

