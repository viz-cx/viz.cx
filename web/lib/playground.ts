import type { RpcMethod } from './rpc-schema'
import type { RestEndpoint } from './rest-schema'

export type ParamValues = Record<string, string>

export function buildJsonRpcRequest(method: RpcMethod, values: ParamValues): object {
  if (method.params.length === 0) {
    return { jsonrpc: '2.0', id: 1, method: method.name, params: undefined }
  }

  const params: Record<string, string | number | boolean | string[]> = {}
  for (const p of method.params) {
    const raw = values[p.name] ?? ''
    if (!raw && !p.required) continue
    if (p.type === 'number') {
      params[p.name] = Number(raw) || 0
    } else if (p.type === 'boolean') {
      params[p.name] = raw === 'true'
    } else if (p.type === 'string[]') {
      params[p.name] = raw.split(',').map((s) => s.trim()).filter(Boolean)
    } else {
      params[p.name] = raw
    }
  }

  return { jsonrpc: '2.0', id: 1, method: method.name, params }
}

export function buildCurlRest(endpoint: RestEndpoint, values: ParamValues): string {
  let path = endpoint.path
  for (const p of endpoint.params) {
    const val = values[p.name] ?? (p.example != null ? String(p.example) : `{${p.name}}`)
    path = path.replace(`{${p.name}}`, encodeURIComponent(val))
  }
  return `curl https://api.viz.cx${path}`
}

export function formatJsonRpcRequest(method: RpcMethod, values: ParamValues): string {
  return JSON.stringify(buildJsonRpcRequest(method, values), null, 2)
}
