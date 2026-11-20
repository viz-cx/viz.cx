import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSessionAccount } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
import { followRemote, unfollowRemote } from '@/lib/ap-send'

// user@host (optional leading @) or an https actor URL. Fedify resolves either;
// this only keeps junk away from an outbound request.
const HANDLE = /^(@?[^\s@/]+@[^\s@/]+\.[^\s@/]+|https:\/\/\S+)$/
const str = (v: unknown): string | null => typeof v === 'string' && v.length <= 300 ? v.trim() : null

async function gate(key: string) {
  const me = await getSessionAccount()
  if (!me) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  // Each follow is an outbound WebFinger + actor fetch, hence the tight limit.
  if (!rateLimit(`${key}:${me}`, 10, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  return me
}

export async function POST(req: NextRequest) {
  const me = await gate('follow-remote')
  if (typeof me !== 'string') return me
  const handle = str((await req.json().catch(() => ({}))).handle)
  if (!handle || !HANDLE.test(handle)) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  try {
    const r = await followRemote(me, handle)
    if (r === 'ok') return new NextResponse(null, { status: 204 })
    return NextResponse.json({ error: r }, { status: r === 'blocked' ? 403 : 404 })
  } catch (e) {
    Sentry.captureException(e)
    return NextResponse.json({ error: 'lookup failed' }, { status: 502 })
  }
}

export async function DELETE(req: NextRequest) {
  const me = await gate('follow-remote')
  if (typeof me !== 'string') return me
  const actorId = str((await req.json().catch(() => ({}))).actorId)
  if (!actorId || !URL.canParse(actorId)) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  await unfollowRemote(me, actorId)
  return new NextResponse(null, { status: 204 })
}
