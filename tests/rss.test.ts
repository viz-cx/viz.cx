import { describe, it, expect } from 'vitest'
import { rssFor } from '../lib/rss'
const post = { author: 'alice', slug: 's', lang: 'en', title: 'T & Co', excerpt: 'e', tags: [], blocks: { blocks: [] }, status: 'published', createdAt: new Date('2026-08-16'), updatedAt: new Date() } as never
describe('rssFor', () => {
  it('valid channel with escaped entities and absolute links', () => {
    const xml = rssFor('en', [post])
    expect(xml).toContain('<title>T &amp; Co</title>')
    expect(xml).toContain('<link>https://viz.cx/@alice/s</link>')
  })
  it('ru links carry prefix', () => expect(rssFor('ru', [{ ...(post as object), lang: 'ru' } as never])).toContain('https://viz.cx/ru/@alice/s'))
})
