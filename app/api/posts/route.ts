import { NextRequest, NextResponse } from 'next/server'
import { posts } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { validatePostInput } from '@/lib/post-io'
import { sanitizeDoc } from '@/lib/sanitize'
import { uniqueSlug } from '@/lib/slug'
import { excerptOf } from '@/lib/excerpt'
export async function POST(req: NextRequest) {
  const author = await getSessionAccount()
  if (!author) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const input = validatePostInput(await req.json().catch(() => null))
  if (!input) return NextResponse.json({ error: 'invalid post' }, { status: 400 })
  const blocks = sanitizeDoc(input.blocks)
  const now = new Date()
  const slug = await uniqueSlug(author, input.title)
  const coverImage = blocks.blocks.find(b => b.type === 'image')
    ?.data && String((blocks.blocks.find(b => b.type === 'image')!.data.file as { url?: string })?.url ?? '') || undefined
  await posts().insertOne({ author, slug, lang: input.lang, title: input.title, blocks, tags: input.tags, excerpt: excerptOf(blocks), coverImage, status: input.status, createdAt: now, updatedAt: now })
  return NextResponse.json({ author, slug })
}
