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
const mockCommitteeWorkerCreateRequest = vi.fn().mockReturnValue({ sign: mockSign })
const mockCommitteeVoteRequest = vi.fn().mockReturnValue({ sign: mockSign })
const mockCommitteeWorkerCancelRequest = vi.fn().mockReturnValue({ sign: mockSign })
const mockValidatorUpdate = vi.fn().mockReturnValue({ sign: mockSign })
const mockVersionedChainPropertiesUpdate = vi.fn().mockReturnValue({ sign: mockSign })
const mockBuilder = {
  award: mockAward,
  transfer: mockTransfer,
  transferToVesting: mockTransferToVesting,
  withdrawVesting: mockWithdrawVesting,
  delegateVestingShares: mockDelegateVestingShares,
  accountValidatorVote: mockAccountValidatorVote,
  committeeWorkerCreateRequest: mockCommitteeWorkerCreateRequest,
  committeeVoteRequest: mockCommitteeVoteRequest,
  committeeWorkerCancelRequest: mockCommitteeWorkerCancelRequest,
  validatorUpdate: mockValidatorUpdate,
  versionedChainPropertiesUpdate: mockVersionedChainPropertiesUpdate,
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

  it('createProposal calls committeeWorkerCreateRequest with correct params', async () => {
    const { createProposal } = await import('@/lib/actions')
    await createProposal(TEST_WIF, 'alice', 'alice', 'https://example.com', '0.000 VIZ', '500.000 VIZ', 1209600)
    expect(mockCommitteeWorkerCreateRequest).toHaveBeenCalledWith({
      creator: 'alice',
      worker: 'alice',
      url: 'https://example.com',
      requiredAmountMin: '0.000 VIZ',
      requiredAmountMax: '500.000 VIZ',
      duration: 1209600,
    })
    expect(mockSign).toHaveBeenCalledWith(TEST_WIF)
    expect(mockBroadcast).toHaveBeenCalled()
  })

  it('voteProposal calls committeeVoteRequest with requestId and votePercent', async () => {
    const { voteProposal } = await import('@/lib/actions')
    await voteProposal(TEST_WIF, 'alice', 42, 10000)
    expect(mockCommitteeVoteRequest).toHaveBeenCalledWith({
      voter: 'alice',
      requestId: 42,
      votePercent: 10000,
    })
    expect(mockSign).toHaveBeenCalledWith(TEST_WIF)
    expect(mockBroadcast).toHaveBeenCalled()
  })

  it('cancelProposal calls committeeWorkerCancelRequest', async () => {
    const { cancelProposal } = await import('@/lib/actions')
    await cancelProposal(TEST_WIF, 'alice', 42)
    expect(mockCommitteeWorkerCancelRequest).toHaveBeenCalledWith({
      creator: 'alice',
      requestId: 42,
    })
    expect(mockSign).toHaveBeenCalledWith(TEST_WIF)
    expect(mockBroadcast).toHaveBeenCalled()
  })

  it('updateValidator calls validatorUpdate with url and signing key', async () => {
    const { updateValidator } = await import('@/lib/actions')
    await updateValidator(TEST_WIF, 'alice', 'https://example.com', 'VIZ79AT1EVFf2yu8oj6mTmFbW5KdDSdySsxdkACKcZ9moWgZDeEXq')
    expect(mockValidatorUpdate).toHaveBeenCalledWith({
      owner: 'alice',
      url: 'https://example.com',
      blockSigningKey: 'VIZ79AT1EVFf2yu8oj6mTmFbW5KdDSdySsxdkACKcZ9moWgZDeEXq',
    })
    expect(mockSign).toHaveBeenCalledWith(TEST_WIF)
    expect(mockBroadcast).toHaveBeenCalled()
  })

  it('goIdleValidator calls validatorUpdate with the null signing key', async () => {
    const { goIdleValidator } = await import('@/lib/actions')
    await goIdleValidator(TEST_WIF, 'alice', 'https://example.com')
    expect(mockValidatorUpdate).toHaveBeenCalledWith({
      owner: 'alice',
      url: 'https://example.com',
      blockSigningKey: 'VIZ1111111111111111111111111111111114T1Anm',
    })
  })

  it('updateChainProperties calls versionedChainPropertiesUpdate with index 4', async () => {
    const { updateChainProperties } = await import('@/lib/actions')
    const props = { accountCreationFee: '1.000 VIZ', maximumBlockSize: 131072 } as Parameters<typeof updateChainProperties>[2]
    await updateChainProperties(TEST_WIF, 'alice', props)
    expect(mockVersionedChainPropertiesUpdate).toHaveBeenCalledWith({
      owner: 'alice',
      props: [4, props],
    })
    expect(mockSign).toHaveBeenCalledWith(TEST_WIF)
    expect(mockBroadcast).toHaveBeenCalled()
  })
})
