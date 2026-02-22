import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
