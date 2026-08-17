import { NextRequest, NextResponse } from 'next/server'
import { nonces, profiles } from '@/lib/db'
import { fetchAccount } from '@/lib/chain'
import { verifySig, loginMessage } from '@/lib/verify-sig'
import { createSession, sessionCookie } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (!rateLimit(`login:${ip}`, 10, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  const { account, sig } = await req.json().catch(() => ({}))
  if (typeof account !== 'string' || typeof sig !== 'string') return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const n = await nonces().findOneAndDelete({ account })            // single-use
  if (!n) return NextResponse.json({ error: 'no nonce' }, { status: 401 })
  let acc; try { acc = await fetchAccount(account) } catch { return NextResponse.json({ error: 'chain unavailable, try again' }, { status: 502 }) }
  if (!acc) return NextResponse.json({ error: 'unknown account' }, { status: 401 })
  const pubkeys = acc.regular_authority.key_auths.map(([k]) => k)   // wire snake_case
  if (!verifySig(loginMessage(n.nonce), sig, pubkeys)) return NextResponse.json({ error: 'signature mismatch' }, { status: 401 })
  await profiles().updateOne({ account }, { $setOnInsert: { account, createdAt: new Date() } }, { upsert: true })
  const token = await createSession(account)
  const res = NextResponse.json({ account })
  res.cookies.set(sessionCookie(token))
  return res
}
