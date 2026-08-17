import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { getSessionAccount } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
const TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
export async function POST(req: NextRequest) {
  const account = await getSessionAccount()
  if (!account) return NextResponse.json({ success: 0 }, { status: 401 })
  if (!rateLimit(`upload:${account}`, 20, 60_000)) return NextResponse.json({ success: 0 }, { status: 429 })
  const file = (await req.formData()).get('image')
  if (!(file instanceof File) || !TYPES[file.type] || file.size > 5 * 1024 * 1024)
    return NextResponse.json({ success: 0, error: 'jpeg/png/webp/gif ≤ 5MB' }, { status: 400 })
  const dir = process.env.MEDIA_DIR ?? './media'
  await mkdir(dir, { recursive: true })
  const name = randomUUID() + TYPES[file.type]
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
  return NextResponse.json({ success: 1, file: { url: `/media/${name}` } })
}
