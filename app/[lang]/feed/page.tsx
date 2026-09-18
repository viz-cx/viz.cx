import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { isLang, langHref, t } from '@/lib/i18n'
import { sql } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { listPosts, publicPostFilter } from '@/lib/queries'
import PostCard from '@/components/post-card'
export default async function FeedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const me = await getSessionAccount()
  if (!me) redirect(langHref(lang, '/login'))
  const authors = (await sql<{ following: string }[]>`select following from follows where follower = ${me}`).map(f => f.following)
  const items = await listPosts(sql`${publicPostFilter(lang)} and author = any(${authors}::text[])`, 1, 50)
  return <div className="flex flex-col gap-3">{items.length === 0 ? <p className="opacity-60">{t(lang, 'feed.empty')}</p> : items.map(p => <PostCard key={p.id} post={p} lang={lang} />)}</div>
}
