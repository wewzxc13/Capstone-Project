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
        destination: 'http://192.168.254.151/capstone-project/backend/:path*',
      },
    ];
  },
};

export default nextConfig;
