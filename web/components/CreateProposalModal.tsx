'use client'
import { useState, useEffect, useRef } from 'react'
import { type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { createProposal } from '@/lib/actions'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateProposalModal({ open, onClose }: Props) {
  const wallet = useWallet()
  const [url, setUrl] = useState('')
  const [amountMin, setAmountMin] = useState('0')
  const [amountMax, setAmountMax] = useState('')
  const [days, setDays] = useState('')
  const [worker, setWorker] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) setWorker(wallet.account ?? '')
  }, [open, wallet.account])

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null }
      setUrl(''); setAmountMin('0'); setAmountMax(''); setDays(''); setWorker('')
      setError(null); setDone(false)
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
    const minN = parseFloat(amountMin) || 0
    const maxN = parseFloat(amountMax)
    const daysN = parseInt(days, 10)
    if (isNaN(maxN) || maxN <= 0) { setError('Enter a valid maximum amount'); return }
    if (maxN < minN) { setError('Maximum must be ≥ minimum'); return }
    if (isNaN(daysN) || daysN < 5 || daysN > 30) { setError('Duration must be 5–30 days'); return }
    const wif = wallet.walletKeys.regular as Wif | undefined
    if (!wif) { setError('Regular key required'); return }
    setLoading(true); setError(null)
    try {
      await createProposal(
        wif,
        wallet.account!,
        worker.trim() || wallet.account!,
        url,
        `${minN.toFixed(3)} VIZ`,
        `${maxN.toFixed(3)} VIZ`,
        daysN * 86400
      )
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
        aria-labelledby="create-proposal-modal-title"
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="create-proposal-modal-title" className="font-prose text-base font-semibold text-fg">New proposal</h2>
          <button onClick={onClose} className="text-xl leading-none text-fg-dim hover:text-fg" aria-label="Close">×</button>
        </div>
        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Submitted</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cp-url" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">
                Details URL <span className="text-acc-red">*</span>
              </label>
              <input id="cp-url" type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://…" required disabled={loading}
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none disabled:opacity-50" />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="cp-min" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">Min VIZ</label>
                <input id="cp-min" type="number" min="0" step="0.001" value={amountMin}
                  onChange={e => setAmountMin(e.target.value)} placeholder="0.000" disabled={loading}
                  className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none disabled:opacity-50" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="cp-max" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">
                  Max VIZ <span className="text-acc-red">*</span>
                </label>
                <input id="cp-max" type="number" min="0.001" step="0.001" value={amountMax}
                  onChange={e => setAmountMax(e.target.value)} placeholder="500.000" required disabled={loading}
                  className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none disabled:opacity-50" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cp-days" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">
                Duration (days, 5–30) <span className="text-acc-red">*</span>
              </label>
              <input id="cp-days" type="number" min="5" max="30" step="1" value={days}
                onChange={e => setDays(e.target.value)} placeholder="14" required disabled={loading}
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cp-worker" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">Worker account</label>
              <input id="cp-worker" type="text" value={worker}
                onChange={e => setWorker(e.target.value)} placeholder={wallet.account ?? 'accountname'} disabled={loading}
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none disabled:opacity-50" />
            </div>
            <p className="font-prose text-[10px] text-fg-dim">Fee: 1.000 VIZ · Requires regular key</p>
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas hover:opacity-90 disabled:opacity-50">
              {loading ? 'Submitting…' : 'Submit proposal'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
