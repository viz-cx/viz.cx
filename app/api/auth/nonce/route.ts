import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (!rateLimit(`nonce:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  const { account } = await req.json().catch(() => ({}))
  if (typeof account !== 'string' || !/^[a-z0-9.-]{2,25}$/.test(account)) return NextResponse.json({ error: 'bad account' }, { status: 400 })
  const nonce = randomUUID()
  await sql`delete from nonces where created_at < now() - interval '5 minutes'`   // replaces the Mongo TTL index
  await sql`insert into nonces (nonce, account) values (${nonce}, ${account})`
  return NextResponse.json({ nonce })
}
