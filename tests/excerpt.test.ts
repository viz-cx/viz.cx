import { describe, it, expect } from 'vitest'
import { excerptOf } from '../lib/excerpt'
describe('excerptOf', () => {
  it('first paragraph, tags stripped, capped', () => {
    const doc = { blocks: [
      { type: 'header', data: { text: 'H' } },
      { type: 'paragraph', data: { text: '<b>Bold</b> start of the post' } },
    ] }
    expect(excerptOf(doc)).toBe('Bold start of the post')
  })
  it('empty doc → empty string', () => expect(excerptOf({ blocks: [] })).toBe(''))
  it('caps at max', () => {
    const doc = { blocks: [{ type: 'paragraph', data: { text: 'x'.repeat(500) } }] }
    expect(excerptOf(doc, 200).length).toBeLessThanOrEqual(201) // 200 + ellipsis
  })
})
