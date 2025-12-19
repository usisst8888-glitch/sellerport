import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'shop-phinf.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: '*.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'img.cafe24.com',
      },
      {
        protocol: 'https',
        hostname: '*.cafe24.com',
      },
    ],
  },
};

export default nextConfig;
