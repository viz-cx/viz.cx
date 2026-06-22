import { describe, it, expect } from 'vitest'
import { validatePropsField, validateProps, propsFromRaw, PROPS_GROUPS, NULL_SIGNING_KEY } from '@/lib/validator'
import type { ChainProperties } from '@viz-cx/core'

const VALID_PROPS: ChainProperties = {
  accountCreationFee: '1.000 VIZ',
  maximumBlockSize: 131072,
  createAccountDelegationRatio: 10,
  createAccountDelegationTime: 2592000,
  minDelegation: '0.001 VIZ',
  minCurationPercent: 1600,
  maxCurationPercent: 1600,
  bandwidthReservePercent: 1000,
  bandwidthReserveBelow: '500.000000 SHARES',
  flagEnergyAdditionalCost: 0,
  voteAccountingMinRshares: 5000000,
  committeeRequestApproveMinPercent: 1000,
  inflationValidatorPercent: 2000,
  inflationRatioCommitteeVsRewardFund: 5000,
  inflationRecalcPeriod: 806400,
  dataOperationsCostAdditionalBandwidth: 0,
  validatorMissPenaltyPercent: 100,
  validatorMissPenaltyDuration: 86400,
  createInviteMinBalance: '10.000 VIZ',
  committeeCreateRequestFee: '100.000 VIZ',
  createPaidSubscriptionFee: '100.000 VIZ',
  accountOnSaleFee: '10.000 VIZ',
  subaccountOnSaleFee: '100.000 VIZ',
  validatorDeclarationFee: '10.000 VIZ',
  withdrawIntervals: 28,
  distributionEpochLength: 28800,
}

describe('NULL_SIGNING_KEY', () => {
  it('matches the on-chain null key used to mark an idle validator', () => {
    expect(NULL_SIGNING_KEY).toBe('VIZ1111111111111111111111111111111114T1Anm')
  })
})

describe('PROPS_GROUPS', () => {
  it('covers all 26 ChainProperties fields exactly once', () => {
    const allKeys = PROPS_GROUPS.flatMap((g) => g.fields.map((f) => f.key))
    expect(allKeys).toHaveLength(26)
    expect(new Set(allKeys).size).toBe(26)
  })
})

describe('validatePropsField', () => {
  it('rejects a percent field above 10000 basis points', () => {
    const field = PROPS_GROUPS.flatMap((g) => g.fields).find((f) => f.key === 'minCurationPercent')!
    expect(validatePropsField(field, 10001)).toMatch(/0.*10000/)
  })

  it('accepts a percent field within range', () => {
    const field = PROPS_GROUPS.flatMap((g) => g.fields).find((f) => f.key === 'minCurationPercent')!
    expect(validatePropsField(field, 1600)).toBeNull()
  })

  it('rejects a non-positive asset field', () => {
    const field = PROPS_GROUPS.flatMap((g) => g.fields).find((f) => f.key === 'accountCreationFee')!
    expect(validatePropsField(field, 0)).toMatch(/greater than 0/)
  })
})

describe('validateProps', () => {
  it('passes for a fully valid props object', () => {
    expect(validateProps(VALID_PROPS)).toEqual([])
  })

  it('flags minCurationPercent > maxCurationPercent', () => {
    const errors = validateProps({ ...VALID_PROPS, minCurationPercent: 2000, maxCurationPercent: 1000 })
    expect(errors.some((e) => /min.*max.*curation/i.test(e))).toBe(true)
  })
})

describe('propsFromRaw', () => {
  it('maps snake_case wire keys to camelCase ChainProperties fields', () => {
    const raw = {
      account_creation_fee: '1.000 VIZ',
      maximum_block_size: 131072,
      min_delegation: '0.001 VIZ',
      min_curation_percent: 1600,
      data_operations_cost_additional_bandwidth: 0,
      create_invite_min_balance: '10.000 VIZ',
      distribution_epoch_length: 28800,
    }
    const mapped = propsFromRaw(raw)
    expect(mapped.accountCreationFee).toBe('1.000 VIZ')
    expect(mapped.maximumBlockSize).toBe(131072)
    expect(mapped.minDelegation).toBe('0.001 VIZ')
    expect(mapped.minCurationPercent).toBe(1600)
    expect(mapped.dataOperationsCostAdditionalBandwidth).toBe(0)
    expect(mapped.createInviteMinBalance).toBe('10.000 VIZ')
    expect(mapped.distributionEpochLength).toBe(28800)
  })

  it('leaves absent fields unset', () => {
    const mapped = propsFromRaw({ account_creation_fee: '1.000 VIZ' })
    expect(mapped.accountCreationFee).toBe('1.000 VIZ')
    expect(mapped.maximumBlockSize).toBeUndefined()
  })
})
