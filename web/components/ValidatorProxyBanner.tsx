'use client'
import { useState } from 'react'
import { useWallet } from '@/lib/wallet'
import { AccountChip } from '@/components/AccountChip'
import { compact } from '@/lib/format'
import { ValidatorProxyModal } from '@/components/ValidatorProxyModal'

interface Props {
  currentProxy: string
  proxiedWeightViz: number
  onChanged: () => void
}

export function ValidatorProxyBanner({ currentProxy, proxiedWeightViz, onChanged }: Props) {
  const wallet = useWallet()
  const [mode, setMode] = useState<'set' | 'clear' | null>(null)

  function open(m: 'set' | 'clear') {
    if (!wallet.connected) { wallet.openModal('connect'); return }
    if (!wallet.keyFor('active')) { wallet.openModal('add-key'); return }
    setMode(m)
  }

  if (!wallet.connected) return null

  const proxied = currentProxy !== ''

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${proxied ? 'border-acc-amber/40 bg-acc-amber/5' : 'border-border bg-surface'}`}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 font-prose text-sm">
          {proxied ? (
            <>
              <span className="text-acc-amber">Validator votes delegated to</span>
              <AccountChip name={currentProxy} size={16} />
            </>
          ) : (
            <span className="text-fg-muted">Your validator votes: <span className="text-fg">direct</span></span>
          )}
        </div>
        {proxiedWeightViz > 0 && (
          <span className="font-mono text-xs text-fg-dim">Proxied to you: {compact(proxiedWeightViz)} VIZ</span>
        )}
      </div>
      <div className="flex gap-2">
        {proxied ? (
          <>
            <button onClick={() => open('set')} className="rounded border border-border px-2.5 py-1 font-prose text-xs text-fg-muted hover:border-border-strong hover:text-fg">Change</button>
            <button onClick={() => open('clear')} className="rounded border border-acc-red/40 px-2.5 py-1 font-prose text-xs text-acc-red hover:border-acc-red">Clear</button>
          </>
        ) : (
          <button onClick={() => open('set')} className="rounded border border-border px-2.5 py-1 font-prose text-xs text-fg-muted hover:border-border-strong hover:text-fg">Set vote proxy</button>
        )}
      </div>
      <ValidatorProxyModal
        open={mode !== null}
        onClose={() => { setMode(null); onChanged() }}
        mode={mode ?? 'set'}
        currentProxy={currentProxy}
      />
    </div>
  )
}
