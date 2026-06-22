'use client'
import { useState, useEffect, useRef } from 'react'
import { type Wif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { voteProposal } from '@/lib/actions'
import { truncateUrl, type CommitteeRequest } from '@/lib/committee'
import { ModalShell } from './ModalShell'

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
    <ModalShell open={open} onClose={onClose} title={title}>
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
    </ModalShell>
  )
}
