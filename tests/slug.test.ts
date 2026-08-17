import { describe, it, expect } from 'vitest'
import { slugify } from '../lib/slug'
describe('slugify', () => {
  it('latin', () => expect(slugify('Why VIZ awards beat likes!')).toBe('why-viz-awards-beat-likes'))
  it('transliterates russian', () => expect(slugify('Мой пост')).toBe('moy-post'))
  it('mixed & symbols', () => expect(slugify('Ёлки & палки — 100%')).toBe('elki-palki-100'))
  it('never empty', () => expect(slugify('!!!')).toBe('post'))
  it('caps at 80 chars', () => expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(80))
})
