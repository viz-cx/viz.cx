'use client'
import Link from 'next/link'
import { useWallet } from '@/lib/wallet'

export function ManageValidatorLink() {
  const wallet = useWallet()
  if (!wallet.connected || !wallet.walletKeys.active) return null
  return (
    <Link
      href="/validator/manage"
      className="rounded border border-border px-3 py-1.5 font-prose text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      Manage my validator
    </Link>
  )
}
