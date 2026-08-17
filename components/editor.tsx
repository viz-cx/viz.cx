'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type EditorJS from '@editorjs/editorjs'
import type { Lang } from '@/lib/types'
import { t, langHref } from '@/lib/i18n'

export default function Editor({ lang: uiLang }: { lang: Lang }) {
  const holder = useRef<HTMLDivElement>(null)
  const editor = useRef<EditorJS | null>(null)
  const [title, setTitle] = useState(''); const [tags, setTags] = useState('')
  const [postLang, setPostLang] = useState<Lang>(uiLang)
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const router = useRouter()
  useEffect(() => {
    let dead = false
    ;(async () => {
      const [{ default: EditorJS }, { default: Header }, { default: List }, { default: ImageTool }, { default: Quote }, { default: Code }, { default: Delimiter }, { default: Embed }] =
        await Promise.all([import('@editorjs/editorjs'), import('@editorjs/header'), import('@editorjs/list'), import('@editorjs/image'), import('@editorjs/quote'), import('@editorjs/code'), import('@editorjs/delimiter'), import('@editorjs/embed')])
      if (dead || !holder.current) return
      editor.current = new EditorJS({
        holder: holder.current,
        tools: { header: Header, list: List, quote: Quote, code: Code, delimiter: Delimiter, embed: Embed,
          image: { class: ImageTool, config: { endpoints: { byFile: '/api/upload' }, field: 'image' } } },
      })
    })()
    return () => { dead = true; editor.current?.destroy?.(); editor.current = null }
  }, [])
  async function save(status: 'draft' | 'published') {
    setBusy(true); setErr(null)
    try {
      const blocks = await editor.current!.save()
      const res = await fetch('/api/posts', { method: 'POST', body: JSON.stringify({ title, lang: postLang, tags: tags.split(','), blocks, status }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'save failed')
      router.push(status === 'published' ? langHref(postLang, `/@${j.author}/${j.slug}`) : langHref(uiLang, `/@${j.author}`))
    } catch (e) { setErr(e instanceof Error ? e.message : 'failed') } finally { setBusy(false) }
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">{(['en', 'ru'] as Lang[]).map(l =>
        <button key={l} onClick={() => setPostLang(l)} className={`rounded border px-3 py-1 ${postLang === l ? 'border-white' : 'border-neutral-700 opacity-60'}`}>{l.toUpperCase()}</button>)}
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t(uiLang, 'write.title')} className="bg-transparent text-2xl font-bold outline-none" />
      <div ref={holder} className="min-h-[200px] rounded border border-dashed border-neutral-700 p-3" />
      <input value={tags} onChange={e => setTags(e.target.value)} placeholder={t(uiLang, 'write.tags')} className="rounded border border-neutral-700 bg-transparent p-2" />
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex gap-2">
        <button disabled={busy || !title} onClick={() => save('published')} className="rounded bg-white px-4 py-2 text-black disabled:opacity-50">{t(uiLang, 'write.publish')}</button>
        <button disabled={busy || !title} onClick={() => save('draft')} className="rounded border border-neutral-700 px-4 py-2">{t(uiLang, 'write.draft')}</button>
      </div>
    </div>
  )
}
