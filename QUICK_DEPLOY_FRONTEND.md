# ⚡ Quick Deploy: Frontend to Vercel

## 3-Minute Setup Guide

### 1️⃣ Push to GitHub
```bash
cd frontend
git init
git add .
git commit -m "Deploy to Vercel"
git remote add origin https://github.com/yourusername/repo-name.git
git push -u origin main
```

### 2️⃣ Deploy to Vercel (via Dashboard)
```
1. Go to vercel.com → Login with GitHub
2. Click "Add New Project"
3. Import your repository
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
```

### 3️⃣ Add Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_BACKEND_PATH=/backend-ville
```
**Note:** No quotes, no trailing slashes!

### 4️⃣ Deploy
```
Click "Deploy" → Wait 2-5 minutes
Get URL: https://your-project.vercel.app
```

### 5️⃣ Update Backend CORS
```
Update backend/.env:
CORS_ORIGIN=https://your-project.vercel.app

Re-upload .env to Namecheap
```

## Alternative: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_API_BASE_URL
# Enter: https://yourdomain.com

vercel env add NEXT_PUBLIC_BACKEND_PATH
# Enter: /backend-ville

# Deploy to production
vercel --prod
```

## Common Commands

### Local Build Test
```bash
npm run build
npm start
# Visit http://localhost:3000
```

### Update Deployment
```bash
git add .
git commit -m "Update"
git push
# Vercel auto-deploys from GitHub
```

### Manual Redeploy
```bash
vercel --prod
```

### View Logs
```bash
vercel logs
```

### Remove Deployment
```bash
vercel remove project-name
```

## Environment Variables

| Variable | Value | Example |
|----------|-------|---------|
| NEXT_PUBLIC_API_BASE_URL | Your domain (no trailing slash) | https://learnersville.online |
| NEXT_PUBLIC_BACKEND_PATH | Backend folder path | /backend-ville |

**Important:** 
- Must start with `NEXT_PUBLIC_` for client-side access
- Redeploy after changing variables
- No quotes needed in Vercel dashboard

## Troubleshooting

| Error | Solution |
|-------|----------|
| Build fails | Check Node.js version (use 18.x or 20.x) |
| API calls fail | Verify environment variables, check CORS in backend |
| 404 on refresh | Next.js handles this automatically, check rewrites |
| Images not loading | Check Uploads folder path and permissions |
| Env vars not working | Must start with NEXT_PUBLIC_, redeploy after changes |

## Testing Checklist
- [ ] Login page loads
- [ ] Can login successfully
- [ ] Dashboard displays correctly
- [ ] API calls work (no CORS errors)
- [ ] Images load properly
- [ ] No console errors (F12)
- [ ] Mobile responsive
- [ ] All routes work

## Performance Tips
- Enable Vercel Analytics (free)
- Use Next.js Image component for images
- Implement lazy loading for heavy components
- Monitor Core Web Vitals in Vercel dashboard

## URLs to Remember
- **Vercel Dashboard:** vercel.com/dashboard
- **Project URL:** your-project.vercel.app
- **Deployment Logs:** vercel.com/yourname/projectname/deployments
- **Analytics:** vercel.com/yourname/projectname/analytics

## Custom Domain (Optional)

### Add to Vercel:
```
1. Project Settings → Domains
2. Add domain: app.yourdomain.com
3. Copy DNS records
```

### Update Namecheap DNS:
```
1. Domain List → Manage → Advanced DNS
2. Add CNAME Record:
   - Type: CNAME
   - Host: app (or www)
   - Value: cname.vercel-dns.com
   - TTL: Automatic
3. Wait for propagation (5 min - 48 hours)
```

## Quick Fixes

### Clear Vercel Cache
```bash
vercel --force
```

### Rollback Deployment
```
Vercel Dashboard → Deployments → Select previous → Promote to Production
```

### Update Environment Variables
```bash
# List current variables
vercel env ls

# Remove variable
vercel env rm NEXT_PUBLIC_API_BASE_URL

# Add new variable
vercel env add NEXT_PUBLIC_API_BASE_URL

# Pull variables to local .env
vercel env pull
```

## Success! 🎉
Your frontend is deployed at: **https://your-project.vercel.app**

Next steps:
1. Test all functionality
2. Update backend CORS
3. Add custom domain (optional)
4. Enable analytics
5. Monitor performance

