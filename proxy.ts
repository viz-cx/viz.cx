import { NextRequest, NextResponse } from 'next/server'
import { fedifyWith, integrateFederation } from '@fedify/next'
import federation from './lib/federation'

// Old explorer deep links 301 to explorer.viz.cx (migration spec step 5)
const EXPLORER = /^\/(block|tx|account|validators?|committee|wallet|richlist|dashboard|learn)(\/|$)/
// Cert-only alias hosts (config/deploy.yml proxy.hosts) — 308 to the apex.
const ALIAS_HOSTS = new Set(['www.viz.cx'])

// Per-request Content-Security-Policy with a fresh nonce. A nonce lets us drop
// 'unsafe-inline' from script-src while still allowing Next's own inline
// bootstrap scripts to run. Next.js reads the nonce from the
// Content-Security-Policy header we set on the *request* below and stamps it
// onto every framework/page <script> it emits during SSR — this requires every
// page to be dynamically rendered (see `export const dynamic = "force-dynamic"`
// in app/layout.tsx); statically prerendered HTML would carry no nonce.
//
// style-src deliberately keeps 'unsafe-inline': a nonce on style-src does NOT
// cover React's inline style={{}} attributes (CSP treats those as
// style-src-attr), a far weaker attack surface than scripts.
function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    // Only same-origin /media/ uploads are ever rendered (see lib/render.ts's
    // image block stored-XSS guard) — no bare https: needed.
    "img-src 'self' data:",
    "font-src 'self'",
    // Must match lib/render.ts's EMBED_HOSTS allowlist exactly.
    'frame-src https://www.youtube.com https://youtube.com https://player.vimeo.com',
    // NEXT_PUBLIC_VIZ_RPC_HTTP (lib/award-broadcast.ts) + NEXT_PUBLIC_WS_URL
    // (lib/broadcast-confirm.ts) defaults — this app's actual chain hosts.
    "connect-src 'self' https://rpc.viz.cx wss://api.viz.cx",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ')
}

// The app's own logic. Not the export Next calls — `proxy` below wraps this in
// Fedify. Exported so tests can exercise the redirect/rewrite rules directly.
export function appProxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const p = url.pathname
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development')

  const host = req.headers.get('host')
  if (host && ALIAS_HOSTS.has(host)) {
    const res = NextResponse.redirect(`https://viz.cx${p}${url.search}`, 308)
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  if (EXPLORER.test(p)) {
    const res = NextResponse.redirect(`https://explorer.viz.cx${p}${url.search}`, 301)
    res.headers.set('Content-Security-Policy', csp)
    return res
  }
  if (p === '/en' || p.startsWith('/en/')) {          // canonical: en is unprefixed
    url.pathname = p.replace(/^\/en/, '') || '/'
    const res = NextResponse.redirect(url, 308)
    res.headers.set('Content-Security-Policy', csp)
    return res
  }
  if (p === '/ru' || p.startsWith('/ru/')) {          // [lang]=ru matches naturally
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', csp)
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    res.headers.set('Content-Security-Policy', csp)
    return res
  }
  url.pathname = `/en${p}`                             // internal rewrite, URL bar unchanged
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)
  const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  return res
}
// Federation requests (Accept / Content-Type of activity+json, ld+json,
// jrd+json, xrd+xml, plus /.well-known/nodeinfo) are answered by Fedify before
// the host redirect, the /en rewrite and the CSP nonce. Everything else falls
// through to appProxy() unchanged. proxy.ts always runs on the Node runtime in
// Next 16, so the Postgres-backed KV/queue is fine here.
//
// Next always calls this with a NextRequest; @fedify/next types the parameter
// as the base Request, which does not satisfy appProxy()'s signature.
const fedified = fedifyWith(federation)((request: Request) => appProxy(request as NextRequest))

// Next 16 takes ONE proxy function per file, as `export default` or as a
// function named `proxy` — and the named one wins when both are present.
// Exporting the raw appProxy under this name would silently disable federation:
// every request would still get its CSP and rewrite, and nothing would ever
// reach Fedify. Keep the wrapper as the `proxy` export.
// fedifyWith dispatches on the Accept/Content-Type header (plus the two nodeinfo
// paths). WebFinger and host-meta are discovery endpoints that serve nothing but
// federation, and RFC 7033 only says a client SHOULD send application/jrd+json —
// a prober sending */* would otherwise get the HTML app and discovery would fail.
// Route them to Fedify on the path alone.
const WELL_KNOWN = /^\/\.well-known\/(webfinger|host-meta)/
const fedFetch = integrateFederation(federation)

// fedifyWith types the wrapped middleware's return as `unknown`; both branches
// actually produce a Response (Fedify's own, or appProxy's NextResponse).
export function proxy(req: NextRequest): Promise<Response> {
  if (WELL_KNOWN.test(req.nextUrl.pathname)) return fedFetch(req) as Promise<Response>
  return fedified(req) as Promise<Response>
}

export const config = { matcher: ['/((?!_next|api|media|favicon\\.ico|robots\\.txt|sitemap|rss).*)'] }
