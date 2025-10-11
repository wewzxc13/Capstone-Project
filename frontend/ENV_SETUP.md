# Environment Variables Setup

This guide explains how to set up environment variables for the frontend application.

## Quick Start

1. Create a `.env.local` file in the `frontend` directory
2. Copy the following content into it:

```env
# API Base URL Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost
NEXT_PUBLIC_BACKEND_PATH=/capstone-project/backend
```

3. Restart your development server

```bash
npm run dev
```

## Environment Variables

### Required Variables

#### `NEXT_PUBLIC_API_BASE_URL`
- **Description**: Base URL for the API server
- **Development**: `http://localhost`
- **Production**: Your production domain (e.g., `https://yourdomain.com`)

#### `NEXT_PUBLIC_BACKEND_PATH`
- **Description**: Path to the backend directory
- **Development**: `/capstone-project/backend`
- **Production**: `/backend` (or your production backend path)

### Optional Variables

#### `BACKEND_ORIGIN`
- **Description**: Backend origin for Next.js rewrites (used in next.config.js)
- **Default**: `http://localhost`
- **Usage**: Only needed if your backend is on a different domain

## Configuration Examples

### Local Development (XAMPP)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost
NEXT_PUBLIC_BACKEND_PATH=/capstone-project/backend
```

### Local Development (Custom Port)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_BACKEND_PATH=/capstone-project/backend
```

### Production

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourschool.com
NEXT_PUBLIC_BACKEND_PATH=/backend
```

### Staging

```env
NEXT_PUBLIC_API_BASE_URL=https://staging.yourschool.com
NEXT_PUBLIC_BACKEND_PATH=/backend
```

## File Structure

```
frontend/
├── .env.local          # Your local environment variables (DO NOT COMMIT)
├── .env.local.example  # Example file (safe to commit)
├── .env.production     # Production variables (if needed)
├── config/
│   ├── api.ts         # API configuration using environment variables
│   └── README.md      # API documentation
└── ENV_SETUP.md       # This file
```

## Important Notes

### Security

- **Never commit `.env.local` to version control**
- The `.env.local` file is already in `.gitignore`
- Only commit `.env.local.example` as a template

### Next.js Environment Variables

- Variables must start with `NEXT_PUBLIC_` to be accessible in the browser
- Changes to environment variables require a server restart
- Environment variables are embedded at build time

### Troubleshooting

#### Issue: API requests failing

**Solution**: Make sure you've created the `.env.local` file and restarted the development server.

```bash
# Stop the server (Ctrl+C)
# Then restart it
npm run dev
```

#### Issue: Environment variables not updating

**Solution**: Environment variables are cached. Restart your development server.

```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart the server
npm run dev
```

#### Issue: 404 errors on API calls

**Solution**: Check that the `next.config.js` rewrites are configured correctly:

```javascript
async rewrites() {
  const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost";
  return [
    {
      source: "/php/:path*",
      destination: `${BACKEND_ORIGIN}/capstone-project/backend/:path*`,
    },
  ];
}
```

## Verifying Setup

You can verify your environment variables are loaded correctly by checking the browser console:

```javascript
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('Backend Path:', process.env.NEXT_PUBLIC_BACKEND_PATH);
```

Or create a test page:

```typescript
// pages/test-env.tsx
export default function TestEnv() {
  return (
    <div>
      <h1>Environment Variables</h1>
      <p>API Base URL: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>
      <p>Backend Path: {process.env.NEXT_PUBLIC_BACKEND_PATH}</p>
    </div>
  );
}
```

## Migration from Hardcoded URLs

If you're migrating from hardcoded URLs:

### Before
```typescript
const response = await axios.post("/php/login.php", data);
```

### After
```typescript
import { API } from '@/config/api';

const response = await axios.post(API.auth.login(), data);
```

The new approach automatically uses environment variables and works across all environments.

## Support

For more information, see:
- [config/README.md](config/README.md) - API configuration documentation
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

