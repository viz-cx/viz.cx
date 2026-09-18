import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
async function parse(req: NextRequest) {
  const me = await getSessionAccount()
  if (!me) return null
  const { following } = await req.json().catch(() => ({}))
  if (typeof following !== 'string' || following === me || !/^[a-z0-9.-]{2,25}$/.test(following)) return null
  return { me, following }
}
export async function POST(req: NextRequest) {
  const p = await parse(req)
  if (!p) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  if (!rateLimit(`follow:${p.me}`, 30, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  await sql`insert into follows (follower, following) values (${p.me}, ${p.following}) on conflict do nothing`
  return new NextResponse(null, { status: 204 })
}
export async function DELETE(req: NextRequest) {
  const p = await parse(req)
  if (!p) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  if (!rateLimit(`follow:${p.me}`, 30, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  await sql`delete from follows where follower = ${p.me} and following = ${p.following}`
  return new NextResponse(null, { status: 204 })
}
