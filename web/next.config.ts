import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output → self-contained server.js for the Kamal node-app image
  // (same pattern as seahava / massageinalanya). The Dockerfile copies
  // .next/standalone and runs `node server.js`.
  output: "standalone",
  // www is only a mirror — permanently redirect it to the bare apex (path +
  // query preserved). Host-scoped to www so the proxy healthcheck (non-www
  // Host) is never redirected. permanent:true => 308.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.viz.cx" }],
        destination: "https://viz.cx/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
