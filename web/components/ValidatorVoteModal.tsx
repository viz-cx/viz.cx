'use client'
import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@/lib/wallet'
import { voteValidator } from '@/lib/actions'
import { ModalShell } from './ModalShell'

interface Props {
  open: boolean
  onClose: () => void
  validator: string
  currentlyVoted: boolean
}

export function ValidatorVoteModal({ open, onClose, validator, currentlyVoted }: Props) {
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null }
      setError(null); setDone(false)
    }
  }, [open])

  async function handleConfirm() {
    const wif = wallet.keyFor('active')
    if (!wif) { setError('Active key required'); return }
    setLoading(true); setError(null)
    try {
      await voteValidator(wif, wallet.account!, validator, !currentlyVoted)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={currentlyVoted ? 'Remove vote' : 'Vote for validator'}>
        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Done</p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="font-prose text-sm text-fg">
              {currentlyVoted
                ? <><span>Remove vote for </span><span className="font-mono text-fg-muted">@{validator}</span><span>?</span></>
                : <><span>Vote for </span><span className="font-mono text-fg-muted">@{validator}</span><span>?</span></>
              }
            </p>
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded border border-border py-2 font-prose text-sm text-fg-muted hover:text-fg">Cancel</button>
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
