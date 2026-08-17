import type { EditorDoc, EditorBlock } from './types'
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
const EMBED_HOSTS = ['www.youtube.com', 'youtube.com', 'player.vimeo.com']
// @editorjs/list@2.0.9 saves items as { content: string; items: ListItem[] } objects (items nest for sub-lists),
// not plain strings — render item.content and recurse into nested items as a sub-<ul>/<ol>.
function renderList(items: unknown[], style: string): string {
  const tag = style === 'ordered' ? 'ol' : 'ul'
  return `<${tag}>${renderListItems(items, style)}</${tag}>`
}
function renderListItems(items: unknown[], parentStyle: string): string {
  return items.map(i => {
    if (typeof i === 'string') return `<li>${i}</li>`
    if (i && typeof i === 'object') {
      const item = i as Record<string, unknown>
      const content = typeof item.content === 'string' ? item.content : ''
      const subItems = Array.isArray(item.items) ? item.items : []
      const style = typeof item.style === 'string' ? item.style : parentStyle
      const sub = subItems.length ? renderList(subItems, style) : ''
      return `<li>${content}${sub}</li>`
    }
    return '<li></li>'
  }).join('')
}
function renderBlock(b: EditorBlock): string {
  const d = b.data as Record<string, unknown>
  switch (b.type) {
    case 'paragraph': return `<p>${String(d.text ?? '')}</p>` // sanitized on save
    case 'header': {
      const l = Math.min(Math.max(Number(d.level) || 2, 2), 4)
      return `<h${l}>${String(d.text ?? '')}</h${l}>`
    }
    case 'list': return renderList(Array.isArray(d.items) ? d.items : [], typeof d.style === 'string' ? d.style : '')
    case 'code': return `<pre><code>${escapeHtml(String(d.code ?? ''))}</code></pre>`
    case 'quote': {
      const cite = d.caption ? `<cite>${String(d.caption)}</cite>` : ''
      return `<blockquote><p>${String(d.text ?? '')}</p>${cite}</blockquote>`
    }
    case 'image': {
      const url = String((d.file as Record<string, unknown> | undefined)?.url ?? '')
      if (!url.startsWith('/media/')) return '' // stored-XSS guard: only our uploads
      const cap = d.caption ? `<figcaption>${String(d.caption)}</figcaption>` : ''
      return `<figure><img src="${escapeHtml(url)}" alt="" loading="lazy">${cap}</figure>`
    }
    case 'delimiter': return '<hr>'
    case 'embed': {
      const url = String(d.embed ?? '')
      try {
        const u = new URL(url)
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return ''
        if (!EMBED_HOSTS.includes(u.hostname)) return ''
      } catch { return '' }
      return `<iframe src="${escapeHtml(url)}" loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`
    }
    default: return '' // unknown types render nothing — never crash the page
  }
}
export function renderBlocks(doc: EditorDoc): string {
  return doc.blocks.map(renderBlock).filter(Boolean).join('')
}
