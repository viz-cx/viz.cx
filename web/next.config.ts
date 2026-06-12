import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output → self-contained server.js for the Kamal node-app image
  // (same pattern as seahava / massageinalanya). The Dockerfile copies
  // .next/standalone and runs `node server.js`.
  output: "standalone",
};

export default nextConfig;
