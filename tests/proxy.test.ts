import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import proxy from '../proxy'

// Host comes from the header, not the URL — kamal-proxy forwards the original
// Host, and proxy.ts reads req.headers.get('host').
const req = (url: string, host: string) => new NextRequest(url, { headers: { host } })

describe('proxy host + explorer redirects', () => {
  it('www.viz.cx 308s to the apex, path + query preserved', () => {
    const res = proxy(req('https://www.viz.cx/tag/x?y=1', 'www.viz.cx'))
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://viz.cx/tag/x?y=1')
    expect(res.headers.get('content-security-policy')).toMatch(/script-src 'self' 'nonce-/)
  })
  it('beta.viz.cx 308s to the apex', () => {
    const res = proxy(req('https://beta.viz.cx/', 'beta.viz.cx'))
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('https://viz.cx/')
  })
  it('explorer deep links on the apex 301 to explorer.viz.cx', () => {
    const res = proxy(req('https://viz.cx/wallet?tab=keys', 'viz.cx'))
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://explorer.viz.cx/wallet?tab=keys')
  })
  it('apex root is rewritten to /en, not redirected', () => {
    const res = proxy(req('https://viz.cx/', 'viz.cx'))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-middleware-rewrite')).toContain('/en')
  })
})
