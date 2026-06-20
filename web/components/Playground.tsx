'use client'
import { useState } from 'react'
import { RPC_METHODS, type RpcMethod } from '@/lib/rpc-schema'
import { REST_ENDPOINTS, type RestEndpoint } from '@/lib/rest-schema'
import { buildJsonRpcRequest, buildCurlRest, type ParamValues } from '@/lib/playground'
import { ParamInput } from './ParamInput'

type Target = 'rpc' | 'rest'

interface Props {
  defaultMethod?: string
  compact?: boolean
}

export function Playground({ defaultMethod, compact = false }: Props) {
  const [target, setTarget] = useState<Target>('rpc')
  const [rpcMethod, setRpcMethod] = useState<RpcMethod>(
    RPC_METHODS.find((m) => m.name === defaultMethod) ?? RPC_METHODS[0]
  )
  const [restEndpoint, setRestEndpoint] = useState<RestEndpoint>(REST_ENDPOINTS[0])
  const [values, setValues] = useState<ParamValues>({})
  const [copied, setCopied] = useState(false)

  const activeParams = target === 'rpc' ? rpcMethod.params : restEndpoint.params

  const requestText =
    target === 'rpc'
      ? JSON.stringify(buildJsonRpcRequest(rpcMethod, values), null, 2)
      : buildCurlRest(restEndpoint, values)

  const endpointLabel =
    target === 'rpc' ? 'POST https://node.viz.cx' : `GET https://api.viz.cx${restEndpoint.path}`

  function handleCopy() {
    navigator.clipboard.writeText(requestText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function setParam(name: string, val: string) {
    setValues((prev) => ({ ...prev, [name]: val }))
  }

  function switchTarget(t: Target) {
    setTarget(t)
    setValues({})
  }

  function switchMethod(name: string) {
    const m = RPC_METHODS.find((m) => m.name === name)
    if (m) { setRpcMethod(m); setValues({}) }
  }

  function switchEndpoint(path: string) {
    const e = REST_ENDPOINTS.find((e) => e.path === path)
    if (e) { setRestEndpoint(e); setValues({}) }
  }

  const panelClass = compact
    ? 'flex flex-col gap-6'
    : 'flex flex-col md:flex-row'

  return (
    <div className={`${panelClass} rounded-lg border border-border bg-surface overflow-hidden`}>
      {/* Left panel — controls */}
      <div className={`${compact ? '' : 'md:w-80 md:shrink-0 md:border-r md:border-border'} p-4 flex flex-col gap-4`}>
        {/* Target toggle */}
        <div>
          <span className="block text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase mb-2">
            Target
          </span>
          <div className="flex gap-2">
            {(['rpc', 'rest'] as Target[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTarget(t)}
                className={`px-3 py-1 rounded text-xs font-mono uppercase ${
                  target === t
                    ? 'bg-acc-green text-canvas font-semibold'
                    : 'bg-surface-2 text-fg-muted border border-border hover:border-border-strong'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Method / endpoint picker */}
        <div>
          <span className="block text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase mb-2">
            {target === 'rpc' ? 'Method' : 'Endpoint'}
          </span>
          {target === 'rpc' ? (
            <select
              value={rpcMethod.name}
              onChange={(e) => switchMethod(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded px-2 py-1.5 text-sm text-fg focus:outline-none focus:border-border-strong"
            >
              {RPC_METHODS.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          ) : (
            <select
              value={restEndpoint.path}
              onChange={(e) => switchEndpoint(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded px-2 py-1.5 text-sm text-fg focus:outline-none focus:border-border-strong"
            >
              {REST_ENDPOINTS.map((e) => (
                <option key={e.path} value={e.path}>{e.method} {e.path}</option>
              ))}
            </select>
          )}
        </div>

        {/* Param inputs */}
        {activeParams.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase">
              Parameters
            </span>
            {activeParams.map((p) => (
              <ParamInput
                key={p.name}
                param={p}
                value={values[p.name] ?? ''}
                onChange={(v) => setParam(p.name, v)}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleCopy}
          className="mt-auto w-full bg-acc-green text-canvas font-semibold text-sm py-1.5 rounded hover:opacity-90 transition-opacity"
        >
          {copied ? 'Copied!' : 'Copy request'}
        </button>
      </div>

      {/* Right panel — output */}
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
        <span className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase">
          {target === 'rpc' ? 'JSON-RPC request' : 'curl command'}
        </span>
        <pre className="flex-1 bg-surface-3 border border-border rounded p-3 text-xs text-fg overflow-x-auto whitespace-pre-wrap font-mono">
          {requestText}
        </pre>
        <span className="text-[11px] text-fg-muted font-mono truncate">{endpointLabel}</span>
      </div>
    </div>
  )
}
