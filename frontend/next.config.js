/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/LoginSection",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
