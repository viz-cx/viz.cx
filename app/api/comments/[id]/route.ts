import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { CommentDoc } from '@/lib/types'
import { getSessionAccount } from '@/lib/session'
import { canDeleteComment } from '@/lib/comment-io'
import { announceCommentDelete } from '@/lib/ap-send'
import { isId } from '@/lib/ids'

// Soft delete. 404 rather than 403 everywhere — no probing for comment ids.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await getSessionAccount()
  if (!account || !isId(id)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const [c] = await sql<(CommentDoc & { postAuthor: string })[]>`
    select c.*, p.author as post_author from comments c join posts p on p.id = c.post_id
    where c.id = ${id} and c.deleted_at is null`
  if (!c || !canDeleteComment(account, c)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  await sql`update comments set deleted_at = now() where id = ${c.id}`
  // Only ours to retract; a remote comment's Tombstone is its own server's job.
  if (c.remoteObject === null) await announceCommentDelete(c)
  return new NextResponse(null, { status: 204 })
}
