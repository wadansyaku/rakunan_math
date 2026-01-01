import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack instead of turbopack for build (due to Japanese path issues)
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
