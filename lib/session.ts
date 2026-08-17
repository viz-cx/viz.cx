import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { sessions } from './db'
const hash = (t: string) => createHash('sha256').update(t).digest('hex')
export const SESSION_COOKIE = 'viz_session'
const TTL_MS = 30 * 24 * 3600 * 1000
export async function createSession(account: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await sessions().insertOne({ tokenHash: hash(token), account, createdAt: new Date(), expiresAt: new Date(Date.now() + TTL_MS) })
  return token
}
export async function getSessionAccount(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const s = await sessions().findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } })
  return s?.account ?? null
}
export async function destroySession(token: string): Promise<void> {
  await sessions().deleteOne({ tokenHash: hash(token) })
}
export function sessionCookie(token: string) {
  return { name: SESSION_COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: TTL_MS / 1000 }
}
