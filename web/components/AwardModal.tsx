'use client'
import { useState, useEffect, useRef } from 'react'
import { createHttpTransport, createReadApi, type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { awardAccount } from '@/lib/actions'
import { NODE_ENDPOINTS } from '@/lib/config'
import { currentEnergy } from '@/lib/format'
import { ModalShell } from './ModalShell'

interface Props {
  open: boolean
  onClose: () => void
  receiver: string
}

const PRESETS = [10, 25, 50, 100]

export function AwardModal({ open, onClose, receiver }: Props) {
  const wallet = useWallet()
  const [energyPct, setEnergyPct] = useState(25)
  const [customInput, setCustomInput] = useState('')
  const [memo, setMemo] = useState('')
  const [availableEnergy, setAvailableEnergy] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null }
      setCustomInput(''); setMemo(''); setError(null); setDone(false)
      setEnergyPct(25); setAvailableEnergy(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !wallet.account) return
    let cancelled = false
    const transport = createHttpTransport(NODE_ENDPOINTS[0])
    const api = createReadApi(transport)
    api.getAccounts([wallet.account])
      .then(([acc]) => {
        if (!cancelled && acc)
          setAvailableEnergy(Math.round(currentEnergy(acc.energy, acc['last_vote_time'] as string | undefined)))
      })
      .catch(() => {/* non-fatal */})
    return () => { cancelled = true }
  }, [open, wallet.account])

  const effectivePct = customInput !== '' ? Number(customInput) : energyPct
  const maxPct = availableEnergy ?? 100
  const clampedPct = Math.min(effectivePct, maxPct)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (clampedPct < 1) { setError('Energy must be at least 1%'); return }
    const wif = wallet.walletKeys.regular as Wif | undefined
    if (!wif) { setError('Regular key required'); return }
    setError(null); setLoading(true)
    try {
      await awardAccount(wif, wallet.account!, receiver, clampedPct, memo || undefined)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={`Award @${receiver}`}>
        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Done</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="award-energy" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">
                Energy %{availableEnergy !== null ? ` (${availableEnergy}% available)` : ''}
              </label>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setCustomInput(''); setEnergyPct(p) }}
                    className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${
                      customInput === '' && energyPct === p
                        ? 'border-acc-green bg-acc-green/10 text-acc-green'
                        : 'border-border text-fg-muted hover:border-border-strong hover:text-fg'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <input
                id="award-energy"
                type="number"
                min={1}
                max={maxPct}
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder="or type custom %"
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="award-memo" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">
                Memo (optional)
              </label>
              <input
                id="award-memo"
                type="text"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="leave empty to skip"
                className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
            </div>

            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Awarding…' : `Award ${clampedPct}%`}
            </button>
          </form>
        )}
    </ModalShell>
  )
}
