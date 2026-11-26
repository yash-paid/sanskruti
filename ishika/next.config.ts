import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: '/connect', destination: '/connect/index.html' },
      { source: '/connect/', destination: '/connect/index.html' },
      { source: '/connect/:path*', destination: '/connect/index.html' },
      { source: '/assets/:path*', destination: '/connect/assets/:path*' },
    ];
  },
};

export default nextConfig;
