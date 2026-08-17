import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { nonces } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (!rateLimit(`nonce:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  const { account } = await req.json().catch(() => ({}))
  if (typeof account !== 'string' || !/^[a-z0-9.-]{2,25}$/.test(account)) return NextResponse.json({ error: 'bad account' }, { status: 400 })
  const nonce = randomUUID()
  await nonces().insertOne({ nonce, account, createdAt: new Date() }) // TTL index: 5 min
  return NextResponse.json({ nonce })
}
