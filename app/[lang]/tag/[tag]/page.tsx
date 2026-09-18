import { notFound } from 'next/navigation'
import { isLang, t } from '@/lib/i18n'
import { listPosts, publicPostFilter } from '@/lib/queries'
import { sql } from '@/lib/db'
import PostCard from '@/components/post-card'
export default async function TagPage({ params }: { params: Promise<{ lang: string; tag: string }> }) {
  const { lang, tag } = await params
  if (!isLang(lang)) notFound()
  const items = await listPosts(sql`${publicPostFilter(lang)} and ${tag.toLowerCase()} = any(tags)`, 1, 50)
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">#{tag}</h1>
      {items.length === 0 ? <p className="opacity-60">{t(lang, 'tag.empty')}</p> : items.map(p => <PostCard key={p.id} post={p} lang={lang} />)}
    </div>
  )
}
