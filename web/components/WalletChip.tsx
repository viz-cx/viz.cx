'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHttpTransport, createReadApi } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { NODE_ENDPOINTS } from '@/lib/config'

export function WalletChip() {
  const wallet = useWallet()
  const router = useRouter()
  const [energy, setEnergy] = useState<number | null>(null)

  useEffect(() => {
    if (!wallet.connected || !wallet.account) { setEnergy(null); return }
    const transport = createHttpTransport(NODE_ENDPOINTS[0])
    const api = createReadApi(transport)
    api
      .getAccounts([wallet.account])
      .then(([acc]) => { if (acc) setEnergy(acc.energy) })
      .catch(() => {})
  }, [wallet.connected, wallet.account])

  if (!wallet.connected) {
    return (
      <button
        onClick={() => wallet.openModal('connect')}
        className="rounded-md border border-border px-3 py-1.5 font-prose text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        Connect
      </button>
    )
  }

  const initials = (wallet.account ?? '').slice(0, 2).toUpperCase()
  const energyPct = energy !== null ? Math.round(energy / 100) : null

  return (
    <button
      onClick={() => router.push('/wallet')}
      className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 transition-colors hover:border-border-strong"
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-[9px] font-semibold text-acc-blue">
        {initials}
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <span className="max-w-[80px] truncate font-mono text-xs text-fg">
          {wallet.account}
        </span>
        {energyPct !== null && (
          <div className="flex items-center gap-1">
            <div className="h-1 w-8 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-acc-green transition-all"
                style={{ width: `${energyPct}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-acc-green">{energyPct}%</span>
          </div>
        )}
      </div>
    </button>
  )
}
