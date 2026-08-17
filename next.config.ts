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
});
