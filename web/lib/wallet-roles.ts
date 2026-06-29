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
 * capability roles each grants. Owner authority grants `active` (owner ⊇ active);
 * a direct active match wins the `active` slot over an owner-derived one.
 */
export function resolveRoleMap(
  raw: Record<string, unknown>,
  candidates: KeyCandidate[]
): Map<WalletRole, Wif> {
  const regularPubs = authorizedPubs(raw, 'regular')
  const activePubs = authorizedPubs(raw, 'active')
  const ownerPubs = authorizedPubs(raw, 'owner')

  const map = new Map<WalletRole, Wif>()

  const regular = candidates.find((c) => regularPubs.includes(c.pub))
  if (regular) map.set('regular', regular.wif)

  const directActive = candidates.find((c) => activePubs.includes(c.pub))
  const ownerActive = candidates.find((c) => ownerPubs.includes(c.pub))
  const active = directActive ?? ownerActive
  if (active) map.set('active', active.wif)

  return map
}
