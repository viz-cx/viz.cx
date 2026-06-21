'use client'
import { useState, useEffect, useRef } from 'react'
import { type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { sendTransfer } from '@/lib/actions'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'form' | 'confirm'

export function TransferModal({ open, onClose }: Props) {
  const wallet = useWallet()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null }
      setTo(''); setAmount(''); setMemo(''); setStep('form'); setError(null); setDone(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  function handleFormSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const n = parseFloat(amount)
    if (!to.trim()) { setError('Recipient required'); return }
    if (isNaN(n) || n <= 0) { setError('Enter a valid amount'); return }
    setError(null)
    setStep('confirm')
  }

  async function handleConfirm() {
    const wif = wallet.walletKeys.active as Wif | undefined
    if (!wif) { setError('Active key required'); return }
    setLoading(true); setError(null)
    try {
      const formatted = `${parseFloat(amount).toFixed(3)} VIZ`
      await sendTransfer(wif, wallet.account!, to.trim(), formatted, memo || undefined)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setStep('form')
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
        aria-labelledby="transfer-modal-title"
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="transfer-modal-title" className="font-prose text-base font-semibold text-fg">Transfer</h2>
          <button onClick={onClose} className="text-xl leading-none text-fg-dim hover:text-fg" aria-label="Close">×</button>
        </div>

        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Done</p>
        ) : step === 'confirm' ? (
          <div className="flex flex-col gap-4">
            <p className="font-prose text-sm text-fg">
              Send <span className="font-mono text-acc-green">{parseFloat(amount).toFixed(3)} VIZ</span> to{' '}
              <span className="font-mono text-fg">@{to}</span>?
            </p>
            {memo && <p className="font-prose text-xs text-fg-muted">Memo: {memo}</p>}
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setStep('form')}
                className="flex-1 rounded border border-border py-2 font-prose text-sm text-fg-muted hover:text-fg"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-to" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">To</label>
              <input
                id="transfer-to"
                type="text"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="account name"
                required
                autoComplete="off"
                className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-amount" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">Amount (VIZ)</label>
              <input
                id="transfer-amount"
                type="number"
                min="0.001"
                step="0.001"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="10.000"
                required
                className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-memo" className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim">Memo (optional)</label>
              <input
                id="transfer-memo"
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
              className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas hover:opacity-90"
            >
              Review
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
