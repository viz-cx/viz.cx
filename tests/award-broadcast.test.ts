import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Wif } from '@viz-cx/core'

const mockBroadcast = vi.fn().mockResolvedValue(undefined)
const mockSign = vi.fn().mockReturnValue({ broadcast: mockBroadcast })
const mockAward = vi.fn().mockReturnValue({ sign: mockSign })
const mockBuilder = { award: mockAward }
const mockCreateTxBuilder = vi.fn().mockReturnValue(mockBuilder)

vi.mock('@viz-cx/core', async (importOriginal) => {
  const real = await importOriginal() as Record<string, unknown>
  return {
    ...real,
    createHttpTransport: vi.fn().mockReturnValue({ call: vi.fn().mockResolvedValue(undefined) }),
    createTxBuilder: mockCreateTxBuilder,
  }
})

const TEST_WIF = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3' as Wif

beforeEach(() => { vi.clearAllMocks() })

describe('awardAccount', () => {
  // Pinned from network.viz.cx/web/lib/__tests__/actions.test.ts (Task 11a) —
  // keeps the energyPct→basis-points wire conversion contract stable.
  it('converts pct to basis points and passes memo', async () => {
    const { awardAccount } = await import('../lib/award-broadcast')
    await awardAccount(TEST_WIF, 'alice', 'bob', 50, 'great post')
    expect(mockAward).toHaveBeenCalledWith({
      initiator: 'alice',
      receiver: 'bob',
      energy: 5000,
      memo: 'great post',
    })
    expect(mockSign).toHaveBeenCalledWith(TEST_WIF)
    expect(mockBroadcast).toHaveBeenCalled()
  })

  it('omits memo when not provided', async () => {
    const { awardAccount } = await import('../lib/award-broadcast')
    await awardAccount(TEST_WIF, 'alice', 'bob', 25)
    expect(mockAward).toHaveBeenCalledWith({
      initiator: 'alice',
      receiver: 'bob',
      energy: 2500,
      memo: undefined,
    })
  })

  it('propagates errors from broadcast', async () => {
    mockBroadcast.mockRejectedValueOnce(new Error('broadcast failed'))
    const { awardAccount } = await import('../lib/award-broadcast')
    await expect(awardAccount(TEST_WIF, 'alice', 'bob', 10)).rejects.toThrow('broadcast failed')
  })
})
