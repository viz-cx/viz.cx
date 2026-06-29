'use client'
import { useState, useCallback } from 'react'
import { useWallet } from '@/lib/wallet'
import {
  type CommitteeRequest,
  type CommitteeVote,
  fetchCommitteeVotes,
  truncateUrl,
  safeHttpUrl,
  daysLeft,
  STATUS_ACTIVE,
  STATUS_LABEL,
} from '@/lib/committee'
import { CommitteeVoteModal } from './CommitteeVoteModal'
import { CancelProposalModal } from './CancelProposalModal'

interface Props {
  request: CommitteeRequest
}

export function CommitteeRequestRow({ request }: Props) {
  const wallet = useWallet()
  const [expanded, setExpanded] = useState(false)
  const [votes, setVotes] = useState<CommitteeVote[] | null>(null)
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [votePercent, setVotePercent] = useState<number | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  const loadVotes = useCallback(async () => {
    setLoadingVotes(true)
    try {
      setVotes(await fetchCommitteeVotes(request.request_id))
    } catch {
      setVotes([])
    } finally {
      setLoadingVotes(false)
    }
  }, [request.request_id])

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (next && votes === null) loadVotes()
  }

  const isActive = request.status === STATUS_ACTIVE
  const isOwner = wallet.account !== null && wallet.account === request.creator
  const myVote = wallet.account ? votes?.find(v => v.voter === wallet.account) : undefined
  const statusLabel = STATUS_LABEL[request.status] ?? `Status ${request.status}`

  return (
    <>
      <div className={`rounded border bg-surface-2 ${expanded ? 'border-border-strong' : 'border-border hover:border-border-strong'}`}>
        {/* collapsed row — entire row is a button */}
        <button
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
          onClick={handleToggle}
        >
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-fg">{truncateUrl(request.url)}</span>
          <span className="shrink-0 font-prose text-xs text-fg-dim">@{request.creator}</span>
          <span className="shrink-0 whitespace-nowrap font-mono text-xs text-fg-dim">
            {request.required_amount_max} · {isActive ? daysLeft(request.end_time) : statusLabel}
          </span>
          <span className="shrink-0 whitespace-nowrap font-mono text-xs text-fg-dim">
            {request.votes_count} {request.votes_count === 1 ? 'vote' : 'votes'}
          </span>
          <span className="shrink-0 text-xs text-fg-dim">{expanded ? '▲' : '▼'}</span>
        </button>

        {/* expanded panel */}
        {expanded && (
          <div className="flex flex-col gap-3 border-t border-border px-3 pb-3 pt-2.5">
            {loadingVotes && <p className="font-prose text-xs text-fg-dim">Loading votes…</p>}

            {/* full URL + meta */}
            <div className="flex flex-col gap-0.5">
              <a href={safeHttpUrl(request.url)} target="_blank" rel="noopener noreferrer"
                className="break-all font-mono text-xs text-acc-green hover:underline"
              >{request.url}</a>
              <p className="font-prose text-xs text-fg-dim">
                Amount: <span className="font-mono text-fg">{request.required_amount_min}–{request.required_amount_max}</span>
                {' · '}Creator: <span className="font-mono text-fg">@{request.creator}</span>
                {' · '}Worker: <span className="font-mono text-fg">@{request.worker}</span>
                {' · '}Status: <span className="font-mono text-fg">{statusLabel}</span>
              </p>
            </div>

            {/* your vote badge */}
            {myVote && (
              <div className="flex w-fit items-center gap-3 rounded border border-border bg-surface px-3 py-1.5">
                <span className={`font-prose text-xs ${myVote.vote_percent > 0 ? 'text-acc-green' : myVote.vote_percent < 0 ? 'text-acc-red' : 'text-fg-dim'}`}>
                  {myVote.vote_percent > 0 ? '✓ You approved' : myVote.vote_percent < 0 ? '✗ You rejected' : 'You voted'}
                </span>
                {isActive && (
                  <button
                    onClick={() => setVotePercent(0)}
                    className="font-prose text-[10px] text-fg-dim underline hover:text-fg"
                  >Remove vote</button>
                )}
              </div>
            )}

            {/* cancel own proposal */}
            {isOwner && isActive && (
              <button
                onClick={() => {
                  if (!wallet.keyFor('regular')) { wallet.openModal('add-key'); return }
                  setCancelOpen(true)
                }}
                className="w-fit rounded border border-acc-red px-3 py-1 font-prose text-xs text-acc-red hover:bg-acc-red/10"
              >Cancel proposal</button>
            )}

            {/* vote buttons (active proposals only) */}
            {isActive && (
              <div className="flex gap-2">
                <button
                  disabled={myVote?.vote_percent === 10000}
                  onClick={() => {
                    if (!wallet.connected) { wallet.openModal('connect'); return }
                    if (!wallet.keyFor('regular')) { wallet.openModal('add-key'); return }
                    setVotePercent(10000)
                  }}
                  className="rounded border border-border px-4 py-1.5 font-prose text-xs text-fg-muted hover:border-border-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                >Approve</button>
                <button
                  disabled={myVote?.vote_percent === -10000}
                  onClick={() => {
                    if (!wallet.connected) { wallet.openModal('connect'); return }
                    if (!wallet.keyFor('regular')) { wallet.openModal('add-key'); return }
                    setVotePercent(-10000)
                  }}
                  className="rounded border border-acc-red/50 px-4 py-1.5 font-prose text-xs text-acc-red/70 hover:border-acc-red hover:text-acc-red disabled:cursor-not-allowed disabled:opacity-40"
                >Reject</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* modals — only mount when needed */}
      {votePercent !== null && (
        <CommitteeVoteModal
          open={true}
          onClose={() => { setVotePercent(null); loadVotes() }}
          proposal={request}
          votePercent={votePercent}
        />
      )}
      <CancelProposalModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        proposal={request}
      />
    </>
  )
}
