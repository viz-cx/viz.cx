export interface RawAccount { name: string; regular_authority: { weight_threshold: number; account_auths: [string, number][]; key_auths: [string, number][] } }
export async function fetchAccount(name: string): Promise<RawAccount | null> {
  const res = await fetch(process.env.VIZ_RPC_HTTP ?? 'https://rpc.viz.cx', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'call', params: ['database_api', 'lookup_account_names', [[name]]] }),
    signal: AbortSignal.timeout(5000), cache: 'no-store',
  })
  if (!res.ok) throw new Error(`rpc ${res.status}`)
  const j = await res.json()
  return (j.result?.[0] as RawAccount | null) ?? null
}
