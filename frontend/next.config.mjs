/** @type {import('next').NextConfig} */
const nextConfig = {
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
    return [
      {
        source: '/php/:path*',
        destination: 'http://localhost/capstone-project/backend/:path*',
      },
    ];
  },
};

export default nextConfig;
