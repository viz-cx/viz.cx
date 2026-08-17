import type { EditorDoc, EditorBlock } from './types'
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
const EMBED_HOSTS = ['www.youtube.com', 'youtube.com', 'player.vimeo.com']
function renderBlock(b: EditorBlock): string {
  const d = b.data as Record<string, unknown>
  switch (b.type) {
    case 'paragraph': return `<p>${String(d.text ?? '')}</p>` // sanitized on save
    case 'header': {
      const l = Math.min(Math.max(Number(d.level) || 2, 2), 4)
      return `<h${l}>${String(d.text ?? '')}</h${l}>`
    }
    case 'list': {
      const tag = d.style === 'ordered' ? 'ol' : 'ul'
      const items = (Array.isArray(d.items) ? d.items : []).map(i => `<li>${typeof i === 'string' ? i : ''}</li>`).join('')
      return `<${tag}>${items}</${tag}>`
    }
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
      try { if (!EMBED_HOSTS.includes(new URL(url).hostname)) return '' } catch { return '' }
      return `<iframe src="${escapeHtml(url)}" loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`
    }
    default: return '' // unknown types render nothing — never crash the page
  }
}
export function renderBlocks(doc: EditorDoc): string {
  return doc.blocks.map(renderBlock).filter(Boolean).join('')
}
