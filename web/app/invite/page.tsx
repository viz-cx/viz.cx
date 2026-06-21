'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet'
import Link from 'next/link'

export default function InvitePage() {
  const wallet = useWallet()
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await wallet.connect(name.trim().toLowerCase(), password)
      router.push('/wallet')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  if (wallet.connected) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <p className="font-prose text-sm text-fg">
            <span className="font-mono">@{wallet.account}</span> is already connected.
          </p>
          <Link
            href="/wallet"
            className="mt-4 inline-block font-prose text-sm text-acc-green hover:underline"
          >
            Go to wallet →
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-1 font-prose text-xl font-semibold text-fg">Join VIZ</h1>
        <p className="mb-6 font-prose text-sm text-fg-muted">
          Enter the account name and password your inviter shared with you.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invite-name"
              className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim"
            >
              Account name
            </label>
            <input
              id="invite-name"
              type="text"
              autoComplete="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="accountname"
              required
              disabled={loading}
              className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invite-password"
              className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim"
            >
              Password
            </label>
            <input
              id="invite-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none disabled:opacity-50"
            />
          </div>
          {error && <p className="font-prose text-xs text-acc-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>
        <p className="mt-5 font-prose text-[10px] text-fg-dim">
          Store your password somewhere safe. There is no recovery option.
        </p>
      </div>
    </main>
  )
}
