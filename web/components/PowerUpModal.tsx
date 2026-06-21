'use client'
import { useState, useEffect, useRef } from 'react'
import { type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { powerUp } from '@/lib/actions'

interface Props {
  open: boolean
  onClose: () => void
}

export function PowerUpModal({ open, onClose }: Props) {
  const wallet = useWallet()
  const [amount, setAmount] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null }
      setAmount(''); setError(null); setDone(false)
    } else {
      setTo(wallet.account ?? '')
    }
  }, [open, wallet.account])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const n = parseFloat(amount)
    if (isNaN(n) || n <= 0) { setError('Enter a valid amount'); return }
    const wif = wallet.walletKeys.active as Wif | undefined
    if (!wif) { setError('Active key required'); return }
    setError(null); setLoading(true)
    try {
      await powerUp(wif, wallet.account!, to.trim() || wallet.account!, `${n.toFixed(3)} VIZ`)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="powerup-modal-title"
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="powerup-modal-title" className="font-prose text-base font-semibold text-fg">Power Up (VIZ → SHARES)</h2>
          <button onClick={onClose} className="text-xl leading-none text-fg-dim hover:text-fg" aria-label="Close">×</button>
        </div>

        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Done</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="powerup-amount" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">Amount (VIZ)</label>
              <input
                id="powerup-amount"
                type="number"
                min="0.001"
                step="0.001"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="100.000"
                required
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="powerup-to" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">Stake for account</label>
              <input
                id="powerup-to"
                type="text"
                value={to}
                onChange={e => setTo(e.target.value)}
                autoComplete="off"
                className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-border-strong focus:outline-none"
              />
              <p className="font-prose text-[10px] text-fg-dim">Defaults to your account. Change to stake on behalf of someone else.</p>
            </div>
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Staking…' : 'Power Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
