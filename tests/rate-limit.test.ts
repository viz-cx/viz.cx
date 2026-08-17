import { describe, it, expect } from 'vitest'
import { rateLimit } from '../lib/rate-limit'
describe('rateLimit', () => {
  it('allows up to limit then blocks', () => {
    const k = 'k' + Math.random()
    expect(rateLimit(k, 2, 1000)).toBe(true)
    expect(rateLimit(k, 2, 1000)).toBe(true)
    expect(rateLimit(k, 2, 1000)).toBe(false)
  })
})
