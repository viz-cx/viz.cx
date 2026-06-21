'use client'
import { useState, useEffect, useRef } from 'react'
import { type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { voteProposal } from '@/lib/actions'
import { truncateUrl, type CommitteeRequest } from '@/lib/committee'

interface Props {
  open: boolean
  onClose: () => void
  proposal: CommitteeRequest
  votePercent: number   // +10000 approve · -10000 reject · 0 remove
}

export function CommitteeVoteModal({ open, onClose, proposal, votePercent }: Props) {
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

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  async function handleConfirm() {
    const wif = wallet.walletKeys.regular as Wif | undefined
    if (!wif) { setError('Regular key required'); return }
    setLoading(true); setError(null)
    try {
      await voteProposal(wif, wallet.account!, proposal.request_id, votePercent)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally { setLoading(false) }
  }

  if (!open) return null

  const title = votePercent > 0 ? 'Approve proposal'
    : votePercent < 0 ? 'Reject proposal'
    : 'Remove vote'

  const body = votePercent > 0 ? 'Cast a full support vote (+100%) for:'
    : votePercent < 0 ? 'Cast a full oppose vote (−100%) for:'
    : 'Remove your vote from:'

  const confirmLabel = votePercent > 0 ? 'Approve' : votePercent < 0 ? 'Reject' : 'Remove vote'
  const confirmClass = votePercent < 0
    ? 'flex-1 rounded border border-acc-red py-2 font-prose text-sm font-semibold text-acc-red disabled:opacity-50'
    : 'flex-1 rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas disabled:opacity-50'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="committee-vote-modal-title"
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="committee-vote-modal-title" className="font-prose text-base font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="text-xl leading-none text-fg-dim hover:text-fg" aria-label="Close">×</button>
        </div>
        {done ? (
          <p className="py-6 text-center font-mono text-sm text-acc-green">✓ Done</p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="font-prose text-sm text-fg-muted">{body}</p>
            <p className="border-l-2 border-border pl-3 font-mono text-sm text-fg">{truncateUrl(proposal.url, 48)}</p>
            {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded border border-border py-2 font-prose text-sm text-fg-muted hover:text-fg">Cancel</button>
              <button onClick={handleConfirm} disabled={loading} className={confirmClass}>
                {loading ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
