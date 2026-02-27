import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
    // Required: next build tries to execute API routes during page data collection,
    // which fails in Docker (no DB at build time). Type safety is enforced by tsc --noEmit.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
