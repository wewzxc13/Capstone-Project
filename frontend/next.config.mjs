/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'chart.js', 'react-chartjs-2'],
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
