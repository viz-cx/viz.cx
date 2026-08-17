import { NextRequest, NextResponse } from 'next/server'

// Old explorer deep links 301 to network.viz.cx (migration spec step 5)
const EXPLORER = /^\/(block|tx|account|validators?|committee|wallet|richlist|dashboard|learn)(\/|$)/

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

export default function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const p = url.pathname
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development')

  if (EXPLORER.test(p)) {
    const res = NextResponse.redirect(`https://network.viz.cx${p}${url.search}`, 301)
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
export const config = { matcher: ['/((?!_next|api|media|favicon\\.ico|robots\\.txt|sitemap|rss).*)'] }
