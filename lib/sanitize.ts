import sanitizeHtml from 'sanitize-html'
import type { EditorDoc, EditorBlock } from './types'
export function sanitizeInline(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'a', 'code', 'mark', 'br'],
    allowedAttributes: { a: ['href'] }, allowedSchemes: ['http', 'https'],
  })
}
// Which data fields hold inline HTML, per Editor.js tool:
const HTML_FIELDS: Record<string, string[]> = {
  paragraph: ['text'], header: ['text'], quote: ['text', 'caption'], image: ['caption'],
}
export function sanitizeDoc(doc: EditorDoc): EditorDoc {
  const blocks = doc.blocks.map((b): EditorBlock => {
    const data = { ...b.data }
    for (const f of HTML_FIELDS[b.type] ?? []) if (typeof data[f] === 'string') data[f] = sanitizeInline(data[f] as string)
    if (b.type === 'list' && Array.isArray(data.items))
      data.items = (data.items as unknown[]).map(i => typeof i === 'string' ? sanitizeInline(i) : i)
    return { ...b, data }
  })
  return { ...doc, blocks }
}
