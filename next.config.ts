import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Content-Security-Policy is set per-request in proxy.ts (needs a fresh nonce
// per request; next.config headers() are static and can't vary per request).
// These headers are safe to enforce unconditionally — unlike CSP they don't
// risk breaking a rendered page.
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  output: "standalone", // Docker: .next/standalone/server.js, see Dockerfile
  // next/dist requires "@swc/helpers/_/_interop_require_default", which Node
  // >=22.12 resolves through the `module-sync` condition to esm/*.js — but the
  // output tracer only copies that package's cjs/, so the standalone server
  // dies at boot with MODULE_NOT_FOUND. Force the esm files in. Path is the
  // pnpm store layout (Docker installs with pnpm too); drop this if a future
  // Next release traces the module-sync condition itself.
  outputFileTracingIncludes: {
    "**/*": ["node_modules/.pnpm/@swc+helpers*/node_modules/@swc/helpers/esm/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

// Wrap with Sentry. Source-map upload only happens when SENTRY_AUTH_TOKEN is
// present, so local/CI builds without it stay clean; silent avoids build noise.
// The runtime SDK still no-ops without a DSN (see the sentry.*.config files).
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  tunnelRoute: true,
});
