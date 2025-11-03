import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*', 
        destination: 'https://wordcast.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
