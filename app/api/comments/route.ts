import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { validateComment } from '@/lib/comment-io'
import { rateLimit } from '@/lib/rate-limit'
export async function POST(req: NextRequest) {
  const author = await getSessionAccount()
  if (!author) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!rateLimit(`comment:${author}`, 10, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  const v = validateComment(await req.json().catch(() => null))
  if (!v) return NextResponse.json({ error: 'invalid comment' }, { status: 400 })
  const [post] = await sql<{ id: string }[]>`select id from posts where id = ${v.postId} and status = 'published' and deleted_at is null`
  if (!post) return NextResponse.json({ error: 'no such post' }, { status: 404 })
  let parentId: string | null = null
  if (v.parentId) {
    const [parent] = await sql<{ id: string; parentId: string | null }[]>`select id, parent_id from comments where id = ${v.parentId} and post_id = ${post.id} and deleted_at is null`
    if (!parent || parent.parentId) return NextResponse.json({ error: 'bad parent' }, { status: 400 }) // one level max
    parentId = parent.id
  }
  const [r] = await sql<{ id: string }[]>`insert into comments (post_id, author, parent_id, body) values (${post.id}, ${author}, ${parentId}, ${v.body}) returning id`
  return NextResponse.json({ id: r.id })
}
