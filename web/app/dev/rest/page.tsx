import type { Metadata } from 'next'
import { DocNav } from '@/components/DocNav'
import { CodeBlock } from '@/components/CodeBlock'

export const metadata: Metadata = { title: 'REST API Reference' }

const FALLBACK_ENDPOINTS = [
  { method: 'GET', path: '/blocks/latest', summary: 'Latest indexed block with all operations.' },
  { method: 'GET', path: '/blocks/{id}', summary: 'Block by number with all operations.' },
  { method: 'GET', path: '/profile/{user}', summary: 'Account profile: balance, SHARES, energy, metadata.' },
  { method: 'GET', path: '/profile/avatar/{user}', summary: 'Account avatar SVG identicon.' },
  { method: 'GET', path: '/richlist', summary: 'Cached top-200 accounts by effective capital.' },
]

interface OpenApiPath {
  get?: { summary?: string; description?: string; parameters?: unknown[] }
}

async function fetchEndpoints() {
  try {
    const res = await fetch('https://api.viz.cx/openapi.json', { cache: 'force-cache' })
    if (!res.ok) return FALLBACK_ENDPOINTS
    const spec = await res.json() as { paths?: Record<string, OpenApiPath> }
    return Object.entries(spec.paths ?? {}).map(([path, item]) => ({
      method: 'GET',
      path,
      summary: item.get?.summary ?? item.get?.description ?? '',
    }))
  } catch {
    return FALLBACK_ENDPOINTS
  }
}

const WS_EXAMPLE = `const ws = new WebSocket('wss://api.viz.cx/ws/ops')
ws.onmessage = (event) => {
  const op = JSON.parse(event.data)
  console.log(op.op[0], op) // e.g. "award", { trx_id, timestamp, op }
}`

export default async function RestPage() {
  const endpoints = await fetchEndpoints()

  return (
    <div className="flex flex-col gap-6">
      <DocNav active="/dev/rest" />

      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">REST API Reference</h1>
        <p className="mt-1 font-prose text-sm text-fg-dim">
          Endpoints served by{' '}
          <a href="https://api.viz.cx" className="text-acc-blue hover:underline" rel="noreferrer">
            api.viz.cx
          </a>
          . All responses are JSON. No authentication required.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase">
          Endpoints
        </h2>
        <div className="rounded-lg border border-border overflow-hidden">
          {endpoints.map((ep, i) => (
            <div
              key={ep.path}
              className={`flex items-start gap-4 px-4 py-3 ${i < endpoints.length - 1 ? 'border-b border-border' : ''}`}
            >
              <span className="text-xs font-mono text-acc-green shrink-0 mt-0.5">{ep.method}</span>
              <span className="text-xs font-mono text-fg shrink-0">{ep.path}</span>
              <span className="font-prose text-xs text-fg-muted">{ep.summary}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[10px] font-prose font-semibold tracking-widest text-fg-dim uppercase">
          WebSocket — live operation feed
        </h2>
        <p className="font-prose text-sm text-fg-muted">
          Connect to <code className="text-fg">wss://api.viz.cx/ws/ops</code> to receive a message for every
          operation applied to the chain within ~5 blocks of the tip. Each message is a JSON-encoded operation record.
        </p>
        <CodeBlock code={WS_EXAMPLE} lang="typescript" />
      </div>
    </div>
  )
}
