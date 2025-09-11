/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/LoginSection',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost';
    return [
      {
        source: '/php/:path*',
        destination: `${BACKEND_ORIGIN}/capstone-project/backend/:path*`,
      },
    ];
  },
};

export default nextConfig;
