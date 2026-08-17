import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { comments, posts } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { validateComment } from '@/lib/comment-io'
import { rateLimit } from '@/lib/rate-limit'
export async function POST(req: NextRequest) {
  const author = await getSessionAccount()
  if (!author) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!rateLimit(`comment:${author}`, 10, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  const v = validateComment(await req.json().catch(() => null))
  if (!v) return NextResponse.json({ error: 'invalid comment' }, { status: 400 })
  const postId = new ObjectId(v.postId)
  const post = await posts().findOne({ _id: postId, status: 'published', deletedAt: { $exists: false } })
  if (!post) return NextResponse.json({ error: 'no such post' }, { status: 404 })
  let parentId: ObjectId | undefined
  if (v.parentId) {
    const parent = await comments().findOne({ _id: new ObjectId(v.parentId), postId, deletedAt: { $exists: false } })
    if (!parent || parent.parentId) return NextResponse.json({ error: 'bad parent' }, { status: 400 }) // one level max
    parentId = parent._id
  }
  const r = await comments().insertOne({ postId, author, ...(parentId ? { parentId } : {}), body: v.body, createdAt: new Date() })
  return NextResponse.json({ id: String(r.insertedId) })
}
