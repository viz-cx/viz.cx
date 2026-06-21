import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Wif } from '@viz-cx/core'

const mockBroadcast = vi.fn().mockResolvedValue(undefined)
const mockSign = vi.fn().mockReturnValue({ broadcast: mockBroadcast })
const mockAward = vi.fn().mockReturnValue({ sign: mockSign })
const mockTransfer = vi.fn().mockReturnValue({ sign: mockSign })
const mockTransferToVesting = vi.fn().mockReturnValue({ sign: mockSign })
const mockWithdrawVesting = vi.fn().mockReturnValue({ sign: mockSign })
const mockDelegateVestingShares = vi.fn().mockReturnValue({ sign: mockSign })
const mockAccountValidatorVote = vi.fn().mockReturnValue({ sign: mockSign })
const mockBuilder = {
  award: mockAward,
  transfer: mockTransfer,
  transferToVesting: mockTransferToVesting,
  withdrawVesting: mockWithdrawVesting,
  delegateVestingShares: mockDelegateVestingShares,
  accountValidatorVote: mockAccountValidatorVote,
}
const mockCreateTxBuilder = vi.fn().mockReturnValue(mockBuilder)

vi.mock('@viz-cx/core', async (importOriginal) => {
  const real = await importOriginal() as Record<string, unknown>
  return {
    ...real,
    createHttpTransport: vi.fn().mockReturnValue({}),
    createTxBuilder: mockCreateTxBuilder,
  }
})

const TEST_WIF = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3' as Wif

beforeEach(() => { vi.clearAllMocks() })

describe('actions', () => {
  it('awardAccount converts pct to basis points and passes memo', async () => {
    const { awardAccount } = await import('@/lib/actions')
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

  it('awardAccount omits memo when not provided', async () => {
    const { awardAccount } = await import('@/lib/actions')
    await awardAccount(TEST_WIF, 'alice', 'bob', 25)
    expect(mockAward).toHaveBeenCalledWith({
      initiator: 'alice',
      receiver: 'bob',
      energy: 2500,
      memo: undefined,
    })
  })

  it('sendTransfer passes all params', async () => {
    const { sendTransfer } = await import('@/lib/actions')
    await sendTransfer(TEST_WIF, 'alice', 'bob', '10.000 VIZ', 'hi')
    expect(mockTransfer).toHaveBeenCalledWith({
      from: 'alice',
      to: 'bob',
      amount: '10.000 VIZ',
      memo: 'hi',
    })
  })

  it('powerUp calls transferToVesting', async () => {
    const { powerUp } = await import('@/lib/actions')
    await powerUp(TEST_WIF, 'alice', 'alice', '100.000 VIZ')
    expect(mockTransferToVesting).toHaveBeenCalledWith({
      from: 'alice',
      to: 'alice',
      amount: '100.000 VIZ',
    })
  })

  it('powerDown calls withdrawVesting', async () => {
    const { powerDown } = await import('@/lib/actions')
    await powerDown(TEST_WIF, 'alice', '1000.000000 SHARES')
    expect(mockWithdrawVesting).toHaveBeenCalledWith({
      account: 'alice',
      vestingShares: '1000.000000 SHARES',
    })
  })

  it('powerDown with 0 SHARES cancels active power-down', async () => {
    const { powerDown } = await import('@/lib/actions')
    await powerDown(TEST_WIF, 'alice', '0.000000 SHARES')
    expect(mockWithdrawVesting).toHaveBeenCalledWith({
      account: 'alice',
      vestingShares: '0.000000 SHARES',
    })
  })

  it('delegateShares calls delegateVestingShares', async () => {
    const { delegateShares } = await import('@/lib/actions')
    await delegateShares(TEST_WIF, 'alice', 'bob', '500.000000 SHARES')
    expect(mockDelegateVestingShares).toHaveBeenCalledWith({
      delegator: 'alice',
      delegatee: 'bob',
      vestingShares: '500.000000 SHARES',
    })
  })

  it('voteValidator calls accountValidatorVote', async () => {
    const { voteValidator } = await import('@/lib/actions')
    await voteValidator(TEST_WIF, 'alice', 'validator1', true)
    expect(mockAccountValidatorVote).toHaveBeenCalledWith({
      account: 'alice',
      validator: 'validator1',
      approve: true,
    })
  })

  it('propagates errors from broadcast', async () => {
    mockBroadcast.mockRejectedValueOnce(new Error('broadcast failed'))
    const { awardAccount } = await import('@/lib/actions')
    await expect(awardAccount(TEST_WIF, 'alice', 'bob', 10)).rejects.toThrow('broadcast failed')
  })
})
