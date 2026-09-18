import { NextRequest, NextResponse } from 'next/server'
import type { JSONValue } from 'postgres'
import { sql } from '@/lib/db'
import type { Post } from '@/lib/types'
import { getSessionAccount } from '@/lib/session'
import { validatePostInput } from '@/lib/post-io'
import { sanitizeDoc } from '@/lib/sanitize'
import { excerptOf } from '@/lib/excerpt'
import { rateLimit } from '@/lib/rate-limit'
import { isId } from '@/lib/ids'
import { announcePost } from '@/lib/ap-send'
const isAdmin = (a: string) => (process.env.ADMIN_ACCOUNTS ?? '').split(',').includes(a)
async function authorize(id: string) {
  const account = await getSessionAccount()
  if (!account || !isId(id)) return null
  const [post] = await sql<Post[]>`select * from posts where id = ${id} and deleted_at is null`
  if (!post || (post.author !== account && !isAdmin(account))) return null
  return { account, post }
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if (!auth) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!rateLimit(`post-edit:${auth.account}`, 5, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  const input = validatePostInput(await req.json().catch(() => null))
  if (!input) return NextResponse.json({ error: 'invalid post' }, { status: 400 })
  const blocks = sanitizeDoc(input.blocks)
  // lang and slug are immutable after creation — changing them breaks award memos and inbound links
  // postgres.js double-encodes a JSON.stringify'd value bound to ::jsonb — sql.json binds the jsonb OID directly
  const [post] = await sql<Post[]>`update posts set title = ${input.title}, blocks = ${sql.json(blocks as unknown as JSONValue)}, tags = ${input.tags}::text[],
    excerpt = ${excerptOf(blocks)}, status = ${input.status}, updated_at = now() where id = ${auth.post.id} returning *`
  // draft→published is a Create; published→draft retracts with a Delete.
  const was = auth.post.status, now = post.status
  if (was === 'draft' && now === 'published') await announcePost(post, 'create')
  else if (was === 'published' && now === 'published') await announcePost(post, 'update')
  else if (was === 'published' && now === 'draft') await announcePost(post, 'delete')
  return NextResponse.json({ author: post.author, slug: post.slug })
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if (!auth) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!rateLimit(`post-edit:${auth.account}`, 5, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  await sql`update posts set deleted_at = now() where id = ${auth.post.id}`
  if (auth.post.status === 'published') await announcePost(auth.post, 'delete')
  return new NextResponse(null, { status: 204 })
}
