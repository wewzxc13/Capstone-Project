# ✅ Deployment Checklist

Use this checklist to ensure a smooth deployment process.

---

## 🔧 Pre-Deployment Preparation

### Local Testing
- [ ] Application runs without errors locally
- [ ] All features tested and working
- [ ] Database is up to date with latest schema
- [ ] No console errors in browser (F12)
- [ ] Responsive design works on mobile
- [ ] All environment variables documented
- [ ] Code is clean (no debug code, console.logs, or test files)

### Documentation
- [ ] README.md is up to date
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Environment variables listed

### Version Control
- [ ] All changes committed to Git
- [ ] Proper commit messages
- [ ] No sensitive data in repository (.env, passwords, etc.)
- [ ] .gitignore properly configured

---

## 📦 Backend Deployment (Namecheap)

### Phase 1: Database Setup
- [ ] cPanel account accessible
- [ ] MySQL database created
- [ ] Database user created with strong password
- [ ] User added to database with ALL PRIVILEGES
- [ ] Database credentials noted securely
- [ ] SQL file imported successfully via phpMyAdmin
- [ ] All tables present and populated
- [ ] Test query executed successfully

### Phase 2: File Preparation
- [ ] `.env` file created with production values
- [ ] Database credentials correct in `.env`
- [ ] CORS_ORIGIN set to Vercel URL (update after frontend deployment)
- [ ] ENVIRONMENT set to "production"
- [ ] Composer dependencies installed (if applicable)
- [ ] Debug files removed (debug_*.txt, test_*.php)
- [ ] Error logging configured

### Phase 3: File Upload
- [ ] FTP client installed (FileZilla or similar)
- [ ] FTP credentials obtained from cPanel
- [ ] Connected to server successfully
- [ ] Created backend folder (e.g., `/public_html/backend-ville/`)
- [ ] All PHP files uploaded
- [ ] All subdirectories uploaded (Users/, Advisory/, Assessment/, etc.)
- [ ] `.env` file uploaded
- [ ] `vendor/` folder uploaded (if using Composer)
- [ ] `Uploads/` folder created/uploaded
- [ ] Upload verified (spot-check random files)

### Phase 4: Configuration
- [ ] File permissions set correctly:
  - [ ] Folders: 755
  - [ ] PHP files: 644
  - [ ] `.env`: 600
  - [ ] `Uploads/`: 755
  - [ ] `SystemLogs/`: 755
- [ ] `.htaccess` created (if needed)
- [ ] PHP settings configured (upload limits, error logging)
- [ ] `.env` secured in `.htaccess`
- [ ] SSL certificate installed
- [ ] HTTPS forced via redirect

### Phase 5: Testing
- [ ] Health check endpoint works:
  - `https://yourdomain.com/backend-ville/health_check.php`
- [ ] Database connection works
- [ ] Sample API endpoint tested
- [ ] File upload test (if applicable)
- [ ] Error logs accessible and empty
- [ ] CORS headers present in response
- [ ] No PHP errors in logs

### Phase 6: Security
- [ ] Strong database password used
- [ ] `.env` file protected
- [ ] Test files removed
- [ ] Debug mode disabled
- [ ] Error display off in production
- [ ] File permissions secure
- [ ] SSL certificate valid
- [ ] Backup plan in place

---

## 🌐 Frontend Deployment (Vercel)

### Phase 1: Code Repository
- [ ] GitHub account created/accessible
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub:
  ```bash
  git add .
  git commit -m "Deploy to Vercel"
  git push origin main
  ```
- [ ] Repository is public or Vercel has access
- [ ] All files pushed successfully
- [ ] `package.json` includes all dependencies
- [ ] `next.config.js` properly configured

### Phase 2: Vercel Setup
- [ ] Vercel account created
- [ ] Vercel linked to GitHub account
- [ ] New project created in Vercel
- [ ] Repository imported successfully
- [ ] Framework preset: Next.js
- [ ] Root directory configured correctly
- [ ] Build settings verified:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] Node.js version set (18.x or 20.x)

### Phase 3: Environment Variables
- [ ] Environment variables added in Vercel:
  - [ ] `NEXT_PUBLIC_API_BASE_URL` = `https://yourdomain.com`
  - [ ] `NEXT_PUBLIC_BACKEND_PATH` = `/backend-ville`
- [ ] Variable names correct (case-sensitive)
- [ ] No quotes in variable values
- [ ] No trailing slashes in URLs
- [ ] Variables applied to Production, Preview, and Development

### Phase 4: Deployment
- [ ] "Deploy" button clicked
- [ ] Build started successfully
- [ ] No build errors in logs
- [ ] Build completed successfully
- [ ] Deployment URL generated
- [ ] Deployment URL accessible
- [ ] Application loads correctly

### Phase 5: Testing
- [ ] Homepage loads without errors
- [ ] Login page accessible
- [ ] Can login with test credentials
- [ ] Dashboard loads after login
- [ ] Navigation works correctly
- [ ] Images display properly
- [ ] API calls successful (check Network tab)
- [ ] No CORS errors in console
- [ ] No 404 errors
- [ ] No JavaScript errors
- [ ] Mobile view works correctly
- [ ] All user roles accessible
- [ ] All features functional

### Phase 6: Custom Domain (Optional)
- [ ] Domain name decided
- [ ] Domain added in Vercel settings
- [ ] DNS records noted from Vercel
- [ ] DNS updated in Namecheap:
  - [ ] CNAME record added
  - [ ] Host: app (or www)
  - [ ] Value: cname.vercel-dns.com
- [ ] DNS propagation complete (check: https://dnschecker.org)
- [ ] Custom domain works
- [ ] SSL certificate issued automatically
- [ ] HTTPS working on custom domain

---

## 🔗 Integration & Final Testing

### Backend Update
- [ ] Backend `.env` updated with Vercel URL:
  ```
  CORS_ORIGIN=https://your-project.vercel.app
  ```
- [ ] Updated `.env` re-uploaded to server
- [ ] Backend restarted/cleared cache (if applicable)

### Complete Integration Test
- [ ] **Authentication:**
  - [ ] Signup works
  - [ ] Login works
  - [ ] Logout works
  - [ ] Password reset works
  - [ ] OTP verification works

- [ ] **User Management:**
  - [ ] Can view users
  - [ ] Can add new user
  - [ ] Can edit user
  - [ ] Can delete/archive user
  - [ ] Profile pictures upload and display

- [ ] **Advisory/Classes:**
  - [ ] Can view classes
  - [ ] Can assign teachers
  - [ ] Can assign students
  - [ ] Student lists display correctly

- [ ] **Assessment:**
  - [ ] Can create progress cards
  - [ ] Can update assessments
  - [ ] Visual feedback works
  - [ ] Reports generate correctly

- [ ] **Communication:**
  - [ ] Can send direct messages
  - [ ] Can send group messages
  - [ ] Messages display correctly
  - [ ] Notifications work

- [ ] **Schedule:**
  - [ ] Can view schedules
  - [ ] Can create/edit schedules
  - [ ] Calendar displays correctly

- [ ] **Attendance:**
  - [ ] Can mark attendance
  - [ ] Attendance reports work
  - [ ] Statistics display correctly

### Performance Testing
- [ ] Homepage loads in < 3 seconds
- [ ] Dashboard loads in < 3 seconds
- [ ] API responses < 1 second
- [ ] Images load quickly
- [ ] No memory leaks (check Chrome DevTools)
- [ ] Lighthouse score > 80 (performance)

### Cross-Browser Testing
- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version)
- [ ] Edge (latest version)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Security Testing
- [ ] SQL injection prevention tested
- [ ] XSS prevention tested
- [ ] CSRF protection enabled
- [ ] Authentication properly secured
- [ ] Sensitive data not exposed in client
- [ ] HTTPS enforced
- [ ] Secure headers present
- [ ] No sensitive data in console logs

---

## 📊 Post-Deployment

### Monitoring Setup
- [ ] Vercel Analytics enabled
- [ ] Uptime monitor configured (UptimeRobot, Pingdom)
- [ ] Backend health check monitored
- [ ] Error logging configured
- [ ] Performance monitoring setup
- [ ] Database backup scheduled
- [ ] Alerts configured for downtime

### Documentation
- [ ] Deployment process documented
- [ ] Credentials stored securely (password manager)
- [ ] Environment variables documented
- [ ] Backup procedures documented
- [ ] Rollback procedures documented
- [ ] Support contacts listed

### User Training
- [ ] Admin users notified
- [ ] Login credentials provided
- [ ] User guide shared (if applicable)
- [ ] Training session scheduled (if applicable)
- [ ] Support contact provided

### Maintenance Plan
- [ ] Regular backup schedule set
- [ ] Update schedule planned
- [ ] Monitoring dashboard set up
- [ ] Incident response plan created
- [ ] Maintenance window scheduled (if needed)

---

## 🐛 Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Database connection failed | Check `.env` credentials, verify user privileges |
| CORS error | Update `CORS_ORIGIN` in backend `.env` |
| Build fails on Vercel | Check Node.js version, review build logs |
| API calls return 404 | Verify environment variables in Vercel |
| Images not loading | Check `Uploads/` folder permissions (755) |
| 500 error | Check `SystemLogs/error_log.txt` |
| Vercel deployment stuck | Clear cache, try `vercel --force` |
| DNS not resolving | Wait up to 48 hours, check dnschecker.org |
| Login not working | Clear browser cache, check API endpoints |
| Slow performance | Enable caching, optimize images, check database queries |

---

## 📞 Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Namecheap Knowledge Base:** https://www.namecheap.com/support/knowledgebase/
- **Namecheap Live Chat:** Available in cPanel
- **Next.js Documentation:** https://nextjs.org/docs
- **PHP Manual:** https://www.php.net/manual/

---

## ✨ Deployment Complete!

Once all checkboxes are marked:

**🎉 Congratulations! Your application is live!**

**Frontend:** https://your-project.vercel.app  
**Backend:** https://yourdomain.com/backend-ville/

### Important URLs to Bookmark:
- Vercel Dashboard: https://vercel.com/dashboard
- cPanel: https://yourdomain.com/cpanel
- phpMyAdmin: (via cPanel)
- Application URL: https://your-project.vercel.app

### Immediate Next Steps:
1. ⏰ Set up monitoring alerts
2. 💾 Schedule automatic database backups
3. 📧 Configure email notifications
4. 📱 Test on multiple devices
5. 👥 Train end users
6. 📊 Monitor analytics and logs

### Ongoing Maintenance:
- Daily: Check error logs
- Weekly: Review analytics and performance
- Monthly: Update dependencies, security patches
- Quarterly: Full backup and disaster recovery test
- Annually: SSL certificate renewal (usually automatic)

---

**Remember:** Keep your deployment credentials secure and maintain regular backups!

