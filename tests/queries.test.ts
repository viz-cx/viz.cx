// pure helpers only
import { describe, it, expect } from 'vitest'
import { parseHandle } from '../lib/queries'
describe('parseHandle', () => {
  it('decodes and strips @', () => expect(parseHandle('%40alice')).toBe('alice'))
  it('plain @alice', () => expect(parseHandle('@alice')).toBe('alice'))
  it('rejects non-handles', () => { expect(parseHandle('alice')).toBeNull(); expect(parseHandle('@')).toBeNull() })
  it('rejects invalid account chars', () => expect(parseHandle('@Al<ice')).toBeNull())
})
