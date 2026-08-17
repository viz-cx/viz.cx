import type { EditorDoc } from './types'
export function excerptOf(doc: EditorDoc, max = 200): string {
  const p = doc.blocks.find(b => b.type === 'paragraph' && typeof b.data.text === 'string')
  if (!p) return ''
  const text = (p.data.text as string).replace(/<[^>]*>/g, '').trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}
