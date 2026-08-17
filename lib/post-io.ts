import { isLang } from './i18n'
import type { EditorDoc, Lang } from './types'
export function validatePostInput(body: unknown): { title: string; lang: Lang; tags: string[]; blocks: EditorDoc; status: 'draft' | 'published' } | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const title = typeof b.title === 'string' ? b.title.trim() : ''
  if (!title || title.length > 150) return null
  if (typeof b.lang !== 'string' || !isLang(b.lang)) return null
  const doc = b.blocks as EditorDoc | undefined
  if (!doc || !Array.isArray(doc.blocks) || doc.blocks.length > 100) return null
  if (JSON.stringify(doc).length > 100_000) return null
  const tags = [...new Set((Array.isArray(b.tags) ? b.tags : [])
    .filter((t): t is string => typeof t === 'string')
    .map(t => t.trim().toLowerCase()).filter(t => /^[a-zа-яё0-9-]{1,30}$/.test(t)))].slice(0, 5)
  const status = b.status === 'published' ? 'published' : 'draft'
  return { title, lang: b.lang, tags, blocks: { blocks: doc.blocks }, status }
}
