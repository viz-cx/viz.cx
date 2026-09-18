import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { appProxy, proxy, config } from '../proxy'

// Host comes from the header, not the URL — kamal-proxy forwards the original
// Host, and proxy.ts reads req.headers.get('host').
const req = (url: string, host: string) => new NextRequest(url, { headers: { host } })

describe('proxy host + explorer redirects', () => {
  it('www.viz.cx 308s to the apex, path + query preserved', () => {
    const res = appProxy(req('https://www.viz.cx/tag/x?y=1', 'www.viz.cx'))
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://viz.cx/tag/x?y=1')
    expect(res.headers.get('content-security-policy')).toMatch(/script-src 'self' 'nonce-/)
  })
  it('explorer deep links on the apex 301 to explorer.viz.cx', () => {
    const res = appProxy(req('https://viz.cx/wallet?tab=keys', 'viz.cx'))
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://explorer.viz.cx/wallet?tab=keys')
  })
  it('apex root is rewritten to /en, not redirected', () => {
    const res = appProxy(req('https://viz.cx/', 'viz.cx'))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-middleware-rewrite')).toContain('/en')
  })
})

describe('proxy matcher', () => {
  // Federation lives under /ap and /.well-known; if the matcher stopped covering
  // them, fedifyWith would never see an inbox POST or a WebFinger query.
  const re = new RegExp(`^${config.matcher[0]}$`)
  it('covers the federation paths', () => {
    expect(re.test('/.well-known/webfinger')).toBe(true)
    expect(re.test('/ap/users/babin')).toBe(true)
    expect(re.test('/ap/users/babin/inbox')).toBe(true)
    expect(re.test('/ap/inbox')).toBe(true)
  })
  it('still excludes the app routes', () => {
    expect(re.test('/api/posts')).toBe(false)
    expect(re.test('/_next/static/x.js')).toBe(false)
  })
})

describe('the exported proxy is the Fedify-wrapped one', () => {
  // Next 16 takes ONE proxy per file and prefers the export named `proxy` over
  // the default. Exporting appProxy under that name compiles, typechecks and
  // serves every page correctly while silently never reaching Fedify — this is
  // the only thing that catches it.
  it('sends a federation request to Fedify instead of the /en rewrite', async () => {
    const res = await proxy(req('https://viz.cx/.well-known/nodeinfo', 'viz.cx'))
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })
  it('answers WebFinger on path alone, without a jrd Accept header', async () => {
    const res = await proxy(req('https://viz.cx/.well-known/webfinger?resource=acct:x@viz.cx', 'viz.cx'))
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })
  it('still hands ordinary requests to the app', async () => {
    const res = await proxy(req('https://viz.cx/', 'viz.cx'))
    expect(res.headers.get('x-middleware-rewrite')).toContain('/en')
  })
})
