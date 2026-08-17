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
// @editorjs/list@2.0.9 saves items as { content: string; items: ListItem[] } objects (items nest for sub-lists),
// not plain strings — sanitize each item's content field (recursively for nested items).
function sanitizeListItems(items: unknown[]): unknown[] {
  return items.map(i => {
    if (typeof i === 'string') return sanitizeInline(i)
    if (i && typeof i === 'object') {
      const item = i as Record<string, unknown>
      return {
        ...item,
        content: typeof item.content === 'string' ? sanitizeInline(item.content) : item.content,
        items: Array.isArray(item.items) ? sanitizeListItems(item.items) : item.items,
      }
    }
    return i
  })
}
export function sanitizeDoc(doc: EditorDoc): EditorDoc {
  const blocks = doc.blocks.map((b): EditorBlock => {
    const data = { ...b.data }
    for (const f of HTML_FIELDS[b.type] ?? []) if (typeof data[f] === 'string') data[f] = sanitizeInline(data[f] as string)
    if (b.type === 'list' && Array.isArray(data.items))
      data.items = sanitizeListItems(data.items as unknown[])
    return { ...b, data }
  })
  return { ...doc, blocks }
}
