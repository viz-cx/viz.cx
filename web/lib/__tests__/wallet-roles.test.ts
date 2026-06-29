import { describe, it, expect } from 'vitest'
import { keys, type Wif } from '@viz-cx/core'
import { resolveRoleMap, type KeyCandidate } from '@/lib/wallet-roles'

// Deterministic fixtures derived from a master password — no hardcoded pubkeys.
const ACC = 'alice'
const PW = 'hunter2hunter2'
const regularWif = keys.fromPassword(ACC, PW, 'regular')
const activeWif = keys.fromPassword(ACC, PW, 'active')
const ownerWif = keys.fromPassword(ACC, PW, 'owner')
const memoWif = keys.fromPassword(ACC, PW, 'memo')

const pub = (w: Wif) => String(keys.toPublic(w))
const cand = (w: Wif): KeyCandidate => ({ wif: w, pub: pub(w) })

// Raw RPC-shaped account: each authority lists [pubkey, weight] pairs.
function rawAccount(opts: { regular?: Wif; active?: Wif; owner?: Wif }) {
  const auth = (w?: Wif) => (w ? { key_auths: [[pub(w), 1]] } : { key_auths: [] })
  return {
    regular_authority: auth(opts.regular),
    active_authority: auth(opts.active),
    owner_authority: auth(opts.owner),
  } as Record<string, unknown>
}

describe('resolveRoleMap', () => {
  const raw = rawAccount({ regular: regularWif, active: activeWif, owner: ownerWif })

  it('maps an active key to the active role', () => {
    const m = resolveRoleMap(raw, [cand(activeWif)])
    expect(m.get('active')).toBe(activeWif)
    expect(m.has('regular')).toBe(false)
  })

  it('maps a regular key to the regular role', () => {
    const m = resolveRoleMap(raw, [cand(regularWif)])
    expect(m.get('regular')).toBe(regularWif)
    expect(m.has('active')).toBe(false)
  })

  it('maps an owner key to the active role (owner grants active)', () => {
    const m = resolveRoleMap(raw, [cand(ownerWif)])
    expect(m.get('active')).toBe(ownerWif)
  })

  it('prefers the direct active key over the owner key for the active slot', () => {
    const m = resolveRoleMap(raw, [cand(ownerWif), cand(activeWif)])
    expect(m.get('active')).toBe(activeWif)
  })

  it('fills both slots from a full password derivation', () => {
    const m = resolveRoleMap(raw, [cand(ownerWif), cand(activeWif), cand(regularWif)])
    expect(m.get('active')).toBe(activeWif)
    expect(m.get('regular')).toBe(regularWif)
  })

  it('stores a single key under both roles when it is in both authorities', () => {
    const shared = rawAccount({ regular: activeWif, active: activeWif })
    const m = resolveRoleMap(shared, [cand(activeWif)])
    expect(m.get('active')).toBe(activeWif)
    expect(m.get('regular')).toBe(activeWif)
  })

  it('returns an empty map for a key in no authority (e.g. memo)', () => {
    const m = resolveRoleMap(raw, [cand(memoWif)])
    expect(m.size).toBe(0)
  })

  it('only keeps password-derived keys that match (rotated keys)', () => {
    // Account whose on-chain active key is NOT the password-derived one.
    const rotated = rawAccount({ regular: regularWif, active: ownerWif })
    const m = resolveRoleMap(rotated, [cand(ownerWif), cand(activeWif), cand(regularWif)])
    expect(m.get('regular')).toBe(regularWif)
    expect(m.get('active')).toBe(ownerWif) // active authority holds the owner-derived pub
  })
})
