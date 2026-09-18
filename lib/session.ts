import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { sql } from './db'
const hash = (t: string) => createHash('sha256').update(t).digest('hex')
export const SESSION_COOKIE = 'viz_session'
const TTL_MS = 30 * 24 * 3600 * 1000
export async function createSession(account: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await sql`delete from sessions where expires_at < now()`   // replaces the Mongo TTL index
  await sql`insert into sessions (token_hash, account, expires_at) values (${hash(token)}, ${account}, ${new Date(Date.now() + TTL_MS)})`
  return token
}
export async function getSessionAccount(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const [s] = await sql<{ account: string }[]>`select account from sessions where token_hash = ${hash(token)} and expires_at > now()`
  return s?.account ?? null
}
export async function destroySession(token: string): Promise<void> {
  await sql`delete from sessions where token_hash = ${hash(token)}`
}
export function sessionCookie(token: string) {
  return { name: SESSION_COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: TTL_MS / 1000 }
}
