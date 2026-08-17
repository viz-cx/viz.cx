import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { posts } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { validatePostInput } from '@/lib/post-io'
import { sanitizeDoc } from '@/lib/sanitize'
import { excerptOf } from '@/lib/excerpt'
import { rateLimit } from '@/lib/rate-limit'
const isAdmin = (a: string) => (process.env.ADMIN_ACCOUNTS ?? '').split(',').includes(a)
async function authorize(id: string) {
  const account = await getSessionAccount()
  if (!account || !ObjectId.isValid(id)) return null
  const post = await posts().findOne({ _id: new ObjectId(id), deletedAt: { $exists: false } })
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
  await posts().updateOne({ _id: auth.post._id }, { $set: { title: input.title, blocks, tags: input.tags, excerpt: excerptOf(blocks), status: input.status, updatedAt: new Date() } })
  // lang and slug are immutable after creation — changing them breaks award memos and inbound links
  return NextResponse.json({ author: auth.post.author, slug: auth.post.slug })
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if (!auth) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (!rateLimit(`post-edit:${auth.account}`, 5, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  await posts().updateOne({ _id: auth.post._id }, { $set: { deletedAt: new Date() } })
  return new NextResponse(null, { status: 204 })
}
