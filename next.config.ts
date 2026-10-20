import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home folder confuses Turbopack's root detection.
  turbopack: { root: __dirname },
};

export default nextConfig;
