import type { Lang, Post } from './types'
import { langHref } from './i18n'
import { escapeHtml } from './render'

const SITE_URL = process.env.SITE_URL ?? 'https://viz.cx'

export function rssFor(lang: Lang, posts: Post[]): string {
  const items = posts.map(p => {
    const link = `${SITE_URL}${langHref(lang, `/@${p.author}/${p.slug}`)}`
    return `<item><title>${escapeHtml(p.title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${p.createdAt.toUTCString()}</pubDate><description>${escapeHtml(p.excerpt)}</description></item>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>viz.cx</title><link>${SITE_URL}${langHref(lang, '/')}</link><description>viz.cx</description>${items}</channel></rss>`
}
