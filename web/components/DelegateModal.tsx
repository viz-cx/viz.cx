'use client'
import { useState, useEffect, useRef } from 'react'
import { type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { delegateShares } from '@/lib/actions'

interface Props {
  open: boolean
  onClose: () => void
}

export function DelegateModal({ open, onClose }: Props) {
  const wallet = useWallet()
  const [delegatee, setDelegatee] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null }
      setDelegatee(''); setAmount(''); setError(null); setDone(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const n = parseFloat(amount) || 0
    if (!delegatee.trim()) { setError('Enter a delegatee account name'); return }
    const wif = wallet.walletKeys.active as Wif | undefined
    if (!wif) { setError('Active key required'); return }
    setLoading(true); setError(null)
    try {
      await delegateShares(wif, wallet.account!, delegatee.trim(), `${n.toFixed(6)} SHARES`)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally { setLoading(false) }
  }

  if (!open) return null

  const n = parseFloat(amount) || 0
  const isUndelegate = n === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delegate-modal-title"
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="delegate-modal-title" className="font-prose text-base font-semibold text-fg">Delegate SHARES</h2>
          <button onClick={onClose} className="text-xl leading-none text-fg-dim hover:text-fg" aria-label="Close">×</button>
        </div>

        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Done</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="delegate-delegatee" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">Delegatee account</label>
              <input
                id="delegate-delegatee"
                type="text"
                value={delegatee}
                onChange={e => setDelegatee(e.target.value)}
                placeholder="accountname"
                required
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="delegate-amount" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">SHARES to delegate</label>
              <input
                id="delegate-amount"
                type="number"
                min="0"
                step="0.000001"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.000000"
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
              <p className="font-prose text-[10px] text-fg-dim">Enter 0 to remove delegation.</p>
            </div>
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Processing…' : isUndelegate ? 'Remove delegation' : `Delegate ${n.toFixed(6)} SHARES`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
