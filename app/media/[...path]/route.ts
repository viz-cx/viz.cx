import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params
  const name = parts.join('/')
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/.test(name)) return new NextResponse(null, { status: 404 }) // no traversal
  try {
    const buf = await readFile(path.join(process.env.MEDIA_DIR ?? './media', name))
    return new NextResponse(new Uint8Array(buf), { headers: { 'content-type': MIME[path.extname(name)], 'cache-control': 'public, max-age=31536000, immutable' } })
  } catch { return new NextResponse(null, { status: 404 }) }
}
