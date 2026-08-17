import type { MetadataRoute } from 'next'
import { LANGS, langHref } from '@/lib/i18n'
import { listPosts, publicPostFilter } from '@/lib/queries'
import { posts } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.SITE_URL ?? 'https://viz.cx'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = LANGS.map(lang => ({ url: `${SITE_URL}${langHref(lang, '/')}`, lastModified: new Date() }))
  for (const lang of LANGS) {
    // ponytail: single-page cap (1000 posts), paginate via listPosts if the catalog outgrows this
    const items = await listPosts(publicPostFilter(lang), 1, 1000)
    for (const p of items) entries.push({ url: `${SITE_URL}${langHref(lang, `/@${p.author}/${p.slug}`)}`, lastModified: p.updatedAt })
    const tags = await posts().distinct('tags', publicPostFilter(lang))
    for (const tag of tags) entries.push({ url: `${SITE_URL}${langHref(lang, `/tag/${tag}`)}`, lastModified: new Date() })
  }
  return entries
}
