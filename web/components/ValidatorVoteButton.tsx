'use client'
import { useState } from 'react'
import { useWallet } from '@/lib/wallet'
import { ValidatorVoteModal } from './ValidatorVoteModal'

interface Props {
  validator: string
  currentlyVoted: boolean
  disabled?: boolean
  onVote?: () => void
}

export function ValidatorVoteButton({ validator, currentlyVoted, disabled, onVote }: Props) {
  const wallet = useWallet()
  const [open, setOpen] = useState(false)

  function handleClick() {
    if (!wallet.connected) { wallet.openModal('connect'); return }
    if (!wallet.keyFor('active')) { wallet.openModal('add-key'); return }
    setOpen(true)
  }

  if (disabled) {
    return (
      <span className="font-prose text-xs text-fg-dim" title="Clear your vote proxy to vote directly">
        proxied
      </span>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`rounded border px-2 py-0.5 font-prose text-xs transition-colors ${
          currentlyVoted
            ? 'border-acc-red/40 text-acc-red hover:border-acc-red'
            : 'border-border text-fg-muted hover:border-border-strong hover:text-fg'
        }`}
      >
        {currentlyVoted ? 'Unvote' : 'Vote'}
      </button>
      <ValidatorVoteModal
        open={open}
        onClose={() => { setOpen(false); onVote?.() }}
        validator={validator}
        currentlyVoted={currentlyVoted}
      />
    </>
  )
}
