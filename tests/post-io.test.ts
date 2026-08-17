import { describe, it, expect } from 'vitest'
import { validatePostInput } from '../lib/post-io'
const ok = { title: 'T', lang: 'en', tags: ['a', 'B '], blocks: { blocks: [{ type: 'paragraph', data: { text: 'x' } }] }, status: 'published' }
describe('validatePostInput', () => {
  it('accepts and normalizes tags (lowercase, trimmed, ≤5, deduped)', () => {
    const v = validatePostInput({ ...ok, tags: ['a', 'A', ' b ', 'c', 'd', 'e', 'f'] })
    expect(v?.tags).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
  it('rejects bad lang / empty title / >150-char title / non-array blocks', () => {
    expect(validatePostInput({ ...ok, lang: 'de' })).toBeNull()
    expect(validatePostInput({ ...ok, title: '' })).toBeNull()
    expect(validatePostInput({ ...ok, title: 'x'.repeat(151) })).toBeNull()
    expect(validatePostInput({ ...ok, blocks: { blocks: 'nope' } })).toBeNull()
  })
  it('rejects >100 blocks and >100kB payload', () => {
    expect(validatePostInput({ ...ok, blocks: { blocks: Array(101).fill({ type: 'paragraph', data: { text: 'x' } }) } })).toBeNull()
    expect(validatePostInput({ ...ok, blocks: { blocks: [{ type: 'paragraph', data: { text: 'x'.repeat(120_000) } }] } })).toBeNull()
  })
  it('defaults status to draft when absent', () => expect(validatePostInput({ ...ok, status: undefined })?.status).toBe('draft'))
})
