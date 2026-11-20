'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/i18n'
import type { Lang, RemoteFollowing } from '@/lib/types'
export default function RemoteFollow({ following, lang }: { following: RemoteFollowing[]; lang: Lang }) {
  const router = useRouter()
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function call(method: 'POST' | 'DELETE', body: object) {
    setBusy(true); setError('')
    const res = await fetch('/api/follows/remote', { method, body: JSON.stringify(body) }).catch(() => null)
    setBusy(false)
    if (res?.ok) { setHandle(''); router.refresh() }
    else setError(t(lang, res?.status === 404 ? 'feed.remote.notFound' : 'feed.remote.error'))
  }
  return (
    <div className="rounded-lg border border-neutral-800 p-4 text-sm">
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (handle.trim()) call('POST', { handle: handle.trim() }) }}>
        <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@user@mastodon.social" aria-label={t(lang, 'feed.remote.label')}
          className="min-w-0 flex-1 rounded border border-neutral-700 bg-transparent px-2 py-1" />
        <button disabled={busy} className="rounded border border-neutral-700 px-3 py-1 disabled:opacity-50">{t(lang, 'post.follow')}</button>
      </form>
      {error && <p role="alert" className="mt-2 text-red-400">{error}</p>}
      {following.length > 0 && <ul className="mt-3 flex flex-col gap-1">
        {following.map(f => <li key={f.actorId} className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">@{f.handle}{!f.accepted && <span className="ml-2 opacity-60">({t(lang, 'feed.remote.pending')})</span>}</span>
          <button disabled={busy} onClick={() => call('DELETE', { actorId: f.actorId })} className="opacity-60 hover:opacity-100 disabled:opacity-50">{t(lang, 'post.unfollow')}</button>
        </li>)}
      </ul>}
    </div>
  )
}
