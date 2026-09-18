import { NextRequest, NextResponse } from 'next/server'
import type { JSONValue } from 'postgres'
import { sql } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { validatePostInput } from '@/lib/post-io'
import { sanitizeDoc } from '@/lib/sanitize'
import { uniqueSlug } from '@/lib/slug'
import { excerptOf } from '@/lib/excerpt'
import { rateLimit } from '@/lib/rate-limit'
import { announcePost } from '@/lib/ap-send'
import type { Post } from '@/lib/types'
export async function POST(req: NextRequest) {
  const author = await getSessionAccount()
  if (!author) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!rateLimit(`post:${author}`, 5, 60_000)) return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  const input = validatePostInput(await req.json().catch(() => null))
  if (!input) return NextResponse.json({ error: 'invalid post' }, { status: 400 })
  const blocks = sanitizeDoc(input.blocks)
  const slug = await uniqueSlug(author, input.title)
  const img = blocks.blocks.find(b => b.type === 'image')
  const coverImage = img ? String((img.data.file as { url?: string })?.url ?? '') || null : null
  // postgres.js double-encodes a JSON.stringify'd value bound to ::jsonb — sql.json binds the jsonb OID directly
  const [post] = await sql<Post[]>`insert into posts (author, slug, lang, title, blocks, tags, excerpt, cover_image, status)
    values (${author}, ${slug}, ${input.lang}, ${input.title}, ${sql.json(blocks as unknown as JSONValue)}, ${input.tags}::text[], ${excerptOf(blocks)}, ${coverImage}, ${input.status})
    returning *`
  if (post.status === 'published') await announcePost(post, 'create')
  return NextResponse.json({ author, slug })
}
