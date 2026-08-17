import type { MetadataRoute } from 'next'

const SITE_URL = process.env.SITE_URL ?? 'https://viz.cx'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/settings', '/write'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
