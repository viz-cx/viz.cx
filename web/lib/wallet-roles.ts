import type { Wif } from '@viz-cx/core'

export type WalletRole = 'regular' | 'active'

export interface KeyCandidate {
  wif: Wif
  pub: string
}

// lookupAccountNames returns the raw RPC payload: authorities are exposed as
// `<role>_authority` with snake_case `key_auths` (NOT the camelCase Authority type).
type RawAuthority = { key_auths?: Array<[string, number]> } | null | undefined

function authorizedPubs(raw: Record<string, unknown>, authority: string): string[] {
  const auth = raw[`${authority}_authority`] as RawAuthority
  return auth?.key_auths?.map(([k]) => String(k)) ?? []
}

/**
 * Match candidate keys against an account's on-chain authorities and return the
 * capability roles each grants. VIZ's top authority is `master` (not `owner`);
 * the chain accepts a master signature for any active-authority operation, so a
 * master key grants `active` (master ⊇ active). A direct active match wins the
 * `active` slot over a master-derived one.
 *
 * Note: @viz-cx/core derives the master key under the role name `owner`
 * (`keys.fromPassword(acc, pw, 'owner')` / `KeySet.owner`) — that derived key is
 * what populates `master_authority` on-chain.
 */
export function resolveRoleMap(
  raw: Record<string, unknown>,
  candidates: KeyCandidate[]
): Map<WalletRole, Wif> {
  const regularPubs = authorizedPubs(raw, 'regular')
  const activePubs = authorizedPubs(raw, 'active')
  const masterPubs = authorizedPubs(raw, 'master')

  const map = new Map<WalletRole, Wif>()

  const regular = candidates.find((c) => regularPubs.includes(c.pub))
  if (regular) map.set('regular', regular.wif)

  const directActive = candidates.find((c) => activePubs.includes(c.pub))
  const masterActive = candidates.find((c) => masterPubs.includes(c.pub))
  const active = directActive ?? masterActive
  if (active) map.set('active', active.wif)

  return map
}
