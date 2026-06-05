import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      // FAQ merged into the Method page — keep old links + SEO working.
      { source: "/faq", destination: "/data", permanent: true },
    ];
  },
};

export default nextConfig;
