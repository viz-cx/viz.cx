import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchAccount } from '../lib/chain'

const mockFetch = (body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => body }))

afterEach(() => vi.unstubAllGlobals())

describe('fetchAccount', () => {
  it('returns null when account not found', async () => {
    mockFetch({ result: [null] })
    expect(await fetchAccount('nobody')).toBeNull()
  })
  it('returns the account when shape is well-formed', async () => {
    mockFetch({ result: [{ name: 'x', regular_authority: { weight_threshold: 1, account_auths: [], key_auths: [['VIZkey', 1]] } }] })
    const acc = await fetchAccount('x')
    expect(acc?.regular_authority.key_auths).toEqual([['VIZkey', 1]])
  })
  it('throws on malformed chain response instead of returning a broken object', async () => {
    mockFetch({ result: [{ name: 'x' }] }) // missing regular_authority
    await expect(fetchAccount('x')).rejects.toThrow()
  })
})
