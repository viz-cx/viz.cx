'use client'
import { useState, useEffect } from 'react'
import { keys } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'

interface Props {
  open: boolean
  onClose: () => void
  mode: 'connect' | 'add-key'
}

export function ConnectModal({ open, onClose, mode }: Props) {
  const wallet = useWallet()
  const [account, setAccount] = useState('')
  const [input, setInput] = useState('')
  const [role, setRole] = useState<'regular' | 'active'>('regular')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isWif = keys.isWif(input)

  // Clear sensitive state whenever the modal closes
  useEffect(() => {
    if (!open) {
      setAccount('')
      setInput('')
      setError(null)
    }
  }, [open])

  // Dismiss on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'add-key') {
        await wallet.addKey(input, role)
      } else {
        await wallet.connect(
          account.trim().toLowerCase(),
          input,
          isWif ? role : undefined
        )
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const titleId = 'connect-modal-title'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="font-prose text-base font-semibold text-fg">
            {mode === 'add-key' ? 'Add key' : 'Connect wallet'}
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none text-fg-dim hover:text-fg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'connect' && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="modal-account"
                className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim"
              >
                Account
              </label>
              <input
                id="modal-account"
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="alice"
                required
                autoComplete="off"
                className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-key"
              className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim"
            >
              Master password or WIF key
            </label>
            <input
              id="modal-key"
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="password or 5K…"
              required
              autoComplete="new-password"
              className="rounded border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg placeholder:text-fg-dim focus:border-border-strong focus:outline-none"
            />
            {isWif && (
              <p className="font-mono text-[10px] text-acc-green">WIF detected</p>
            )}
          </div>

          {/* In add-key mode, role is always needed (password path derives one key per role).
              In connect mode, role only applies when a WIF is provided. */}
          {(mode === 'add-key' || isWif) && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="modal-role"
                className="text-[10px] font-prose font-semibold uppercase tracking-widest text-fg-dim"
              >
                Role
              </label>
              <select
                id="modal-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'regular' | 'active')}
                className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-border-strong focus:outline-none"
              >
                <option value="regular">regular — awards &amp; social</option>
                <option value="active">active — transfers &amp; delegation</option>
              </select>
            </div>
          )}

          {error && (
            <p className="font-prose text-xs text-acc-red">{error}</p>
          )}

          <p className="font-prose text-[10px] leading-relaxed text-fg-dim">
            Keys are stored encrypted in this browser only. The encryption key is
            co-located in localStorage — use a dedicated WIF for stronger security.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Connecting…' : mode === 'add-key' ? 'Add key' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  )
}
