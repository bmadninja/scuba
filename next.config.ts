import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  async redirects() {
    return [
      { source: "/faq", destination: "/data", permanent: true },
    ];
  },
};

export default nextConfig;
