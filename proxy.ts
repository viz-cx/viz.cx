import { NextRequest, NextResponse } from 'next/server'

// Old explorer deep links 301 to network.viz.cx (migration spec step 5)
const EXPLORER = /^\/(block|tx|account|validators?|committee|wallet|richlist|dashboard|learn)(\/|$)/

export default function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const p = url.pathname
  if (EXPLORER.test(p)) return NextResponse.redirect(`https://network.viz.cx${p}${url.search}`, 301)
  if (p === '/en' || p.startsWith('/en/')) {          // canonical: en is unprefixed
    url.pathname = p.replace(/^\/en/, '') || '/'
    return NextResponse.redirect(url, 308)
  }
  if (p === '/ru' || p.startsWith('/ru/')) return NextResponse.next() // [lang]=ru matches naturally
  url.pathname = `/en${p}`                             // internal rewrite, URL bar unchanged
  return NextResponse.rewrite(url)
}
export const config = { matcher: ['/((?!_next|api|media|favicon\\.ico|robots\\.txt|sitemap|rss).*)'] }
