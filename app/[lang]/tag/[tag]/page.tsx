import { notFound } from 'next/navigation'
import { isLang, t } from '@/lib/i18n'
import { listPosts, publicPostFilter } from '@/lib/queries'
import PostCard from '@/components/post-card'
export default async function TagPage({ params }: { params: Promise<{ lang: string; tag: string }> }) {
  const { lang, tag } = await params
  if (!isLang(lang)) notFound()
  const items = await listPosts({ ...publicPostFilter(lang), tags: tag.toLowerCase() }, 1, 50)
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">#{tag}</h1>
      {items.length === 0 ? <p className="opacity-60">{t(lang, 'tag.empty')}</p> : items.map(p => <PostCard key={String(p._id)} post={p} lang={lang} />)}
    </div>
  )
}
