'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { wif as toWif } from '@viz-cx/core'
import { useWallet } from '@/lib/wallet'
import { t, langHref } from '@/lib/i18n'
import type { Lang } from '@/lib/types'
import { awardMemo } from '@/lib/awards'
import { awardAccount } from '@/lib/award-broadcast'

const PRESETS = [10, 25, 50, 100]

export default function AwardButton({ post, lang, totals }: {
  post: { author: string; slug: string }
  lang: Lang
  totals: { count: number; totalViz: number | null }
}) {
  const { account, keyFor } = useWallet()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pct, setPct] = useState(25)
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const effectivePct = custom !== '' ? Number(custom) : pct
  const clampedPct = Math.min(100, Math.max(1, Math.round(effectivePct) || 1))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      const key = account ? await keyFor(account) : null
      if (!account || !key) throw new Error('wallet key unavailable')
      await awardAccount(toWif(key), account, post.author, clampedPct, awardMemo(post))
      setOpen(false)
      router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : 'failed') } finally { setBusy(false) }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 text-sm">
      <p className="opacity-80">
        🏆 {totals.count} {t(lang, 'post.awardsLabel')}
        {totals.totalViz !== null ? ` · ${totals.totalViz} VIZ` : ''}
      </p>
      {account === null ? (
        <Link href={langHref(lang, '/login')} className="w-fit underline">{t(lang, 'post.award')}</Link>
      ) : !open ? (
        <button onClick={() => setOpen(true)} className="w-fit rounded bg-white text-black px-3 py-1 text-sm">
          {t(lang, 'post.award')}
        </button>
      ) : (
        <form onSubmit={submit} className="flex max-w-xs flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { setCustom(''); setPct(p) }}
                className={`rounded border px-2 py-1 text-xs ${custom === '' && pct === p ? 'border-white' : 'border-neutral-700 opacity-70'}`}
              >
                {p}%
              </button>
            ))}
          </div>
          <input
            type="number" min={1} max={100} value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder={t(lang, 'post.customPct')}
            className="rounded border border-neutral-700 bg-transparent p-2 text-sm"
          />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="rounded bg-white text-black px-3 py-1 text-sm disabled:opacity-50">
              {busy ? '…' : `${t(lang, 'post.award')} ${clampedPct}%`}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs opacity-60 hover:opacity-100">
              {t(lang, 'comments.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
