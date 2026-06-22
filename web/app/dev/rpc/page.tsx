import type { Metadata } from 'next'
import { DocNav } from '@/components/DocNav'
import { CodeBlock } from '@/components/CodeBlock'
import { Playground } from '@/components/Playground'
import { RPC_METHODS } from '@/lib/rpc-schema'
import { buildJsonRpcRequest } from '@/lib/playground'
import Link from 'next/link'

export const metadata: Metadata = { title: 'VIZ RPC Reference' }

const DOCUMENTED = new Set([
  'get_block', 'get_block_header', 'get_dynamic_global_properties',
  'get_accounts', 'lookup_accounts', 'get_account_history',
  'get_ops_in_block', 'get_transaction', 'get_active_validators',
  'get_validator_by_account', 'get_witnesses_by_vote', 'get_witness_schedule',
])

interface Props {
  searchParams: Promise<{ method?: string }>
}

export default async function RpcPage({ searchParams }: Props) {
  const { method: methodName } = await searchParams
  const active = RPC_METHODS.find((m) => m.name === methodName) ?? RPC_METHODS[0]

  const exampleRequest = buildJsonRpcRequest(active, {})
  const curlExample = `curl -X POST https://node.viz.cx \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(exampleRequest, null, 2).replace(/'/g, "\\'")}'`

  return (
    <div className="flex flex-col gap-6">
      <DocNav active="/dev/rpc" />

      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">VIZ RPC Reference</h1>
        <p className="mt-1 font-prose text-sm text-fg-dim">
          JSON-RPC 2.0 methods served by{' '}
          <a href="https://node.viz.cx" className="text-acc-blue hover:underline" rel="noreferrer">
            node.viz.cx
          </a>
          . Endpoint: <code className="text-fg">POST https://node.viz.cx</code>
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Method list */}
        <nav className="w-48 shrink-0 flex flex-col gap-0.5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {RPC_METHODS.map((m) => (
            <Link
              key={m.name}
              href={`/dev/rpc?method=${m.name}`}
              className={`px-2 py-1 rounded text-xs font-mono truncate ${
                m.name === active.name
                  ? 'bg-surface-2 text-fg border border-border'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {m.name}
              {DOCUMENTED.has(m.name) && (
                <span className="ml-1 text-[9px] text-acc-blue">●</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Method detail */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-mono font-semibold text-fg">{active.name}</h2>
            <p className="mt-1 font-prose text-sm text-fg-muted">{active.description}</p>
          </div>

          {/* Params table */}
          {active.params.length > 0 && (
            <div>
              <h3 className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase mb-2">
                Parameters
              </h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-1.5 pr-3 text-left font-prose font-semibold text-fg-dim">Name</th>
                    <th className="py-1.5 pr-3 text-left font-prose font-semibold text-fg-dim">Type</th>
                    <th className="py-1.5 pr-3 text-left font-prose font-semibold text-fg-dim">Req</th>
                    <th className="py-1.5 text-left font-prose font-semibold text-fg-dim">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {active.params.map((p) => (
                    <tr key={p.name} className="border-b border-border">
                      <td className="py-1.5 pr-3 font-mono text-fg">{p.name}</td>
                      <td className="py-1.5 pr-3 font-mono text-acc-amber">{p.type}</td>
                      <td className="py-1.5 pr-3 text-fg-dim">{p.required ? '✓' : ''}</td>
                      <td className="py-1.5 font-prose text-fg-muted">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Result shape */}
          <div>
            <h3 className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase mb-2">
              Returns
            </h3>
            <p className="font-prose text-sm text-fg-muted">{active.resultShape}</p>
          </div>

          {/* curl example */}
          <div>
            <h3 className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase mb-2">
              Example request
            </h3>
            <CodeBlock code={curlExample} lang="bash" />
          </div>

          {/* Embedded playground */}
          <div>
            <h3 className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase mb-2">
              Try it
            </h3>
            <Playground defaultMethod={active.name} compact />
          </div>
        </div>
      </div>
    </div>
  )
}
