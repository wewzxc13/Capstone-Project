/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'chart.js', 'react-chartjs-2'],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Webpack optimizations (only for production builds)
  ...(process.env.NODE_ENV === 'production' && {
    webpack: (config, { dev, isServer }) => {
      // Optimize bundle splitting for production only
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            charts: {
              test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|recharts)[\\/]/,
              name: 'charts',
              chunks: 'all',
            },
          },
        },
      };
      
      return config;
    },
  }),
  
  async redirects() {
    return [
      {
        source: "/",
        destination: "/LoginSection",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/php/:path*",
        destination: "http://localhost/capstone-project/backend/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
