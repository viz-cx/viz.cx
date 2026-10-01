import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "viz.cx",
  description: "viz.cx",
};

// Required for per-request CSP nonces (proxy.ts) — Next only stamps the nonce
// from the request's Content-Security-Policy header onto framework/page
// <script> tags when the page is dynamically rendered. Statically prerendered
// HTML would carry no nonce and its inline scripts would be blocked by CSP.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set by proxy.ts; the tag below must carry it or 'strict-dynamic' blocks it.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Self-hosted Umami (infra docs/runbook-analytics.md); the id is public. */}
        <Script
          nonce={nonce}
          src="https://analytics.nextgensoft.co/script.js"
          data-website-id="bc861a0d-4fb3-4133-8c6a-d4dc9c16822e"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
