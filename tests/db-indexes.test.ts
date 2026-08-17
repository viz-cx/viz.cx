import { describe, it, expect } from 'vitest'
import { ensureIndexes } from '../scripts/ensure-indexes'
import { db } from '../lib/db'
describe('indexes', () => {
  it('creates all indexes idempotently', async () => {
    try { await db.command({ ping: 1 }) } catch { return } // no local mongo — skip
    await ensureIndexes(); await ensureIndexes()
    const idx = await db.collection('posts').indexes()
    expect(idx.some(i => i.unique && i.key.author === 1 && i.key.slug === 1)).toBe(true)
  })
})
