'use client'
import { useState, useEffect, useRef } from 'react'
import { type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { setValidatorProxy } from '@/lib/actions'
import { ModalShell } from './ModalShell'

interface Props {
  open: boolean
  onClose: () => void
  mode: 'set' | 'clear'
  currentProxy: string
}

const NAME_RE = /^[a-z][a-z0-9-.]{2,24}$/

export function ValidatorProxyModal({ open, onClose, mode, currentProxy }: Props) {
  const wallet = useWallet()
  const [target, setTarget] = useState('')
  const [review, setReview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null }
      setTarget(''); setReview(false); setError(null); setDone(false); setLoading(false)
    }
  }, [open])

  function handleNext() {
    const name = target.trim().toLowerCase()
    if (!name) { setError('Enter an account name'); return }
    if (name === wallet.account) { setError('You cannot proxy to yourself'); return }
    if (!NAME_RE.test(name)) { setError('Invalid account name'); return }
    setError(null); setReview(true)
  }

  async function handleConfirm() {
    const wif = wallet.walletKeys.active as Wif | undefined
    if (!wif) { setError('Active key required'); return }
    const proxy = mode === 'clear' ? '' : target.trim().toLowerCase()
    setLoading(true); setError(null)
    try {
      await setValidatorProxy(wif, wallet.account!, proxy)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally { setLoading(false) }
  }

  const showReview = mode === 'clear' || review
  const title = mode === 'clear' ? 'Clear vote proxy' : 'Set vote proxy'

  return (
    <ModalShell open={open} onClose={onClose} title={title}>
        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Done</p>
        ) : !showReview ? (
          <div className="flex flex-col gap-4">
            <label className="font-prose text-sm text-fg-muted">
              Delegate all your validator votes to:
              <input
                autoFocus
                value={target}
                onChange={e => setTarget(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNext() }}
                placeholder="account name"
                className="mt-1 w-full rounded border border-border bg-canvas px-3 py-2 font-mono text-sm text-fg focus:border-border-strong focus:outline-none"
              />
            </label>
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded border border-border py-2 font-prose text-sm text-fg-muted hover:text-fg">Cancel</button>
              <button onClick={handleNext} className="flex-1 rounded bg-acc-blue py-2 font-prose text-sm font-semibold text-canvas">Next</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="font-prose text-sm text-fg">
              {mode === 'clear'
                ? <><span>Stop delegating your validator votes to </span><span className="font-mono text-fg-muted">@{currentProxy}</span><span>? Your direct votes will resume.</span></>
                : <><span>Delegate </span><span className="font-semibold">all</span><span> your validator votes to </span><span className="font-mono text-fg-muted">@{target.trim().toLowerCase()}</span><span>? They will vote on your behalf; your direct votes will be ignored.</span></>
              }
            </p>
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={mode === 'clear' ? onClose : () => setReview(false)}
                className="flex-1 rounded border border-border py-2 font-prose text-sm text-fg-muted hover:text-fg"
              >
                {mode === 'clear' ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas disabled:opacity-50"
              >
                {loading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
    </ModalShell>
  )
}
