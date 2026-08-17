'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet'
import type { Lang } from '@/lib/types'
import { langHref } from '@/lib/i18n'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Signature, PrivateKey } = require('viz-js-lib/lib/auth/ecc')
const wifToPriv = (wif: string) => PrivateKey.fromWif(wif)

export default function LoginForm({ lang }: { lang: Lang }) {
  const [account, setAccount] = useState(''); const [wif, setWif] = useState('')
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const { saveKey } = useWallet(); const router = useRouter()
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      const { nonce } = await (await fetch('/api/auth/nonce', { method: 'POST', body: JSON.stringify({ account }) })).json()
      if (!nonce) throw new Error('nonce failed')
      const sig = Signature.signBuffer(Buffer.from(`viz.cx-login:${nonce}`, 'utf8'), wifToPriv(wif)).toHex()
      const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ account, sig }) })
      if (!res.ok) throw new Error((await res.json()).error ?? 'login failed')
      await saveKey(account, wif)
      router.push(langHref(lang, '/')); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : 'failed') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 max-w-sm">
      <input value={account} onChange={e => setAccount(e.target.value.trim().toLowerCase())} placeholder="account" className="rounded border border-neutral-700 bg-transparent p-2" autoComplete="username" />
      <input value={wif} onChange={e => setWif(e.target.value.trim())} placeholder="regular key (WIF)" type="password" className="rounded border border-neutral-700 bg-transparent p-2" autoComplete="current-password" />
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <button disabled={busy || !account || !wif} className="rounded bg-white text-black p-2 disabled:opacity-50">{busy ? '…' : 'Log in'}</button>
    </form>
  )
}
