'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/i18n'
import type { Lang } from '@/lib/types'

export function CommentForm({ postId, parentId, lang, onPosted }: { postId: string; parentId?: string; lang: Lang; onPosted?: () => void }) {
  const [body, setBody] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/comments', { method: 'POST', body: JSON.stringify({ postId, body, ...(parentId ? { parentId } : {}) }) })
      if (!res.ok) throw new Error((await res.json()).error ?? 'failed')
      setBody('')
      router.refresh()
      onPosted?.()
    } catch (e) { setErr(e instanceof Error ? e.message : 'failed') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder={t(lang, 'comments.placeholder')} rows={3}
        className="rounded border border-neutral-700 bg-transparent p-2 text-sm" />
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <button disabled={busy || !body.trim()} className="self-start rounded bg-white text-black px-3 py-1 text-sm disabled:opacity-50">
        {busy ? '…' : t(lang, 'comments.submit')}
      </button>
    </form>
  )
}

export function ReplyToggle({ postId, parentId, lang }: { postId: string; parentId: string; lang: Lang }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1">
      <button onClick={() => setOpen(o => !o)} className="text-xs opacity-60 hover:opacity-100">
        {t(lang, open ? 'comments.cancel' : 'comments.reply')}
      </button>
      {open && <CommentForm postId={postId} parentId={parentId} lang={lang} onPosted={() => setOpen(false)} />}
    </div>
  )
}
