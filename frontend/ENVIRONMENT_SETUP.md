# Environment Configuration Guide

This guide explains how to configure the application for both local development and production deployment.

## Local Development (Default)

The application is configured by default for local development. No additional setup is required.

**Default Configuration:**
- API Base URL: `http://localhost`
- Backend Path: `/capstone-project/backend`
- Photo URLs: `/php/Uploads/filename.png`

## Production Deployment

To deploy to production, create a `.env.local` file in the frontend directory with the following content:

```bash
# Production Environment Configuration
NEXT_PUBLIC_API_BASE_URL=https://learnersville.online
NEXT_PUBLIC_BACKEND_PATH=/backend-ville
```

**Production Configuration:**
- API Base URL: `https://learnersville.online`
- Backend Path: `/backend-ville`
- Photo URLs: `https://learnersville.online/backend-ville/Uploads/filename.png`

## How It Works

The application automatically detects the environment based on the `NEXT_PUBLIC_API_BASE_URL` environment variable:

1. **Local Development**: Uses `http://localhost` and Next.js rewrite rules
2. **Production**: Uses the full production URL

## Photo URL Generation

The photo URL generation works as follows:

### Local Development
- Input: `default_girl_student.png`
- Output: `/php/Uploads/default_girl_student.png`
- Next.js rewrite: `/php/*` → `http://localhost/capstone-project/backend/*`
- Final URL: `http://localhost/capstone-project/backend/Uploads/default_girl_student.png`

### Production
- Input: `default_girl_student.png`
- Output: `https://learnersville.online/backend-ville/Uploads/default_girl_student.png`
- Direct access to production backend

## Troubleshooting

If photos are not displaying:

1. **Check Environment Variables**: Ensure `.env.local` is configured correctly
2. **Check Backend Access**: Verify the backend is accessible at the configured URL
3. **Check File Permissions**: Ensure the Uploads folder is readable
4. **Check Network Tab**: Look for 404 errors in browser developer tools

## File Structure

```
backend/Uploads/
├── default_girl_student.png
├── default_boy_student.png
├── default_teacher.png
├── default_parent.png
├── default_admin.png
├── default_owner.png
└── [uploaded user photos]
```
