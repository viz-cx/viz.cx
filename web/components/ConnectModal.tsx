'use client'
import { useState, useEffect } from 'react'
import { keys } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { ModalShell } from './ModalShell'

interface Props {
  open: boolean
  onClose: () => void
  mode: 'connect' | 'add-key'
}

export function ConnectModal({ open, onClose, mode }: Props) {
  const wallet = useWallet()
  const [account, setAccount] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isWif = keys.isWif(input)

  // Clear sensitive state whenever the modal closes
  useEffect(() => {
    if (!open) {
      setAccount('')
      setInput('')
      setError(null)
      setSuccess(null)
    }
  }, [open])

  function describeRoles(roles: ('regular' | 'active')[], added: boolean): string {
    const ordered = (['active', 'regular'] as const).filter((r) => roles.includes(r))
    const label = ordered.join(' + ')
    if (added) return `Added — ${label} key`
    return `Connected — ${label} ${ordered.length > 1 ? 'detected' : 'only'}`
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const roles =
        mode === 'add-key'
          ? await wallet.addKey(input)
          : await wallet.connect(account.trim().toLowerCase(), input)
      setSuccess(describeRoles(roles, mode === 'add-key'))
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={mode === 'add-key' ? 'Add key' : 'Connect wallet'}>
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

          {error && (
            <p className="font-prose text-xs text-acc-red">{error}</p>
          )}
          {success && (
            <p className="font-prose text-xs text-acc-green">{success}</p>
          )}

          <p className="font-prose text-[10px] leading-relaxed text-fg-dim">
            Keys are stored encrypted in this browser only. The encryption key is
            co-located in localStorage — use a dedicated WIF for stronger security.
          </p>

          <button
            type="submit"
            disabled={loading || success !== null}
            className="w-full rounded bg-acc-green py-2 font-prose text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Connecting…' : mode === 'add-key' ? 'Add key' : 'Connect'}
          </button>
        </form>
    </ModalShell>
  )
}
