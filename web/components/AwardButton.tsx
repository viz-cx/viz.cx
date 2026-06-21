'use client'
import { useState } from 'react'
import { useWallet } from '@/lib/wallet'
import { AwardModal } from './AwardModal'

interface Props {
  receiver: string
}

export function AwardButton({ receiver }: Props) {
  const wallet = useWallet()
  const [open, setOpen] = useState(false)

  function handleClick() {
    if (!wallet.connected) { wallet.openModal('connect'); return }
    if (!wallet.walletKeys.regular) { wallet.openModal('add-key'); return }
    setOpen(true)
  }

  const label = !wallet.connected
    ? 'Award'
    : !wallet.walletKeys.regular
    ? 'Award (needs regular key)'
    : 'Award'

  return (
    <>
      <button
        onClick={handleClick}
        className="rounded border border-border px-3 py-1.5 font-prose text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        {label}
      </button>
      <AwardModal open={open} onClose={() => setOpen(false)} receiver={receiver} />
    </>
  )
}
