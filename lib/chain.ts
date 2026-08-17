export interface RawAccount { name: string; regular_authority: { weight_threshold: number; account_auths: [string, number][]; key_auths: [string, number][] } }
// runtime shape guard — RPC result is untrusted input, not just a TS cast target
function isRawAccount(x: unknown): x is RawAccount {
  const ra = (x as { regular_authority?: unknown } | null)?.regular_authority as { key_auths?: unknown } | undefined
  return !!x && typeof x === 'object' && !!ra && Array.isArray(ra.key_auths)
}
export async function fetchAccount(name: string): Promise<RawAccount | null> {
  const res = await fetch(process.env.VIZ_RPC_HTTP ?? 'https://rpc.viz.cx', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'call', params: ['database_api', 'lookup_account_names', [[name]]] }),
    signal: AbortSignal.timeout(5000), cache: 'no-store',
  })
  if (!res.ok) throw new Error(`rpc ${res.status}`)
  const j = await res.json()
  const result = j.result?.[0] ?? null
  if (result === null) return null
  if (!isRawAccount(result)) throw new Error('malformed account shape from rpc')
  return result
}
