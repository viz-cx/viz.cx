import { NextRequest, NextResponse } from 'next/server'
import { follows } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
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
  await follows().updateOne({ follower: p.me, following: p.following }, { $setOnInsert: { follower: p.me, following: p.following, createdAt: new Date() } }, { upsert: true })
  return new NextResponse(null, { status: 204 })
}
export async function DELETE(req: NextRequest) {
  const p = await parse(req)
  if (!p) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  await follows().deleteOne({ follower: p.me, following: p.following })
  return new NextResponse(null, { status: 204 })
}
