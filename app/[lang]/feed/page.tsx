import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { isLang, langHref, t } from '@/lib/i18n'
import { sql } from '@/lib/db'
import { getSessionAccount } from '@/lib/session'
import { listPosts, publicPostFilter } from '@/lib/queries'
import { listFollowing, remoteFeed } from '@/lib/ap-inbound'
import type { RemotePost } from '@/lib/types'
import PostCard from '@/components/post-card'
import RemoteFollow from '@/components/remote-follow'

// Remote text is stored tag-free and rendered as text; the link was checked to
// be http(s) on the way in.
function RemoteCard({ post }: { post: RemotePost }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      {post.title && <p className="font-semibold">{post.title}</p>}
      <p className="line-clamp-6 whitespace-pre-line break-words text-sm opacity-75">{post.body}</p>
      <p className="mt-2 text-xs opacity-60">
        <a href={post.url} target="_blank" rel="noopener noreferrer nofollow">@{post.handle}</a> · {post.publishedAt.toISOString().slice(0, 10)}
      </p>
    </div>
  )
}

export default async function FeedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const me = await getSessionAccount()
  if (!me) redirect(langHref(lang, '/login'))
  const authors = (await sql<{ following: string }[]>`select following from follows where follower = ${me}`).map(f => f.following)
  const [local, remote, following] = await Promise.all([
    listPosts(sql`${publicPostFilter(lang)} and author = any(${authors}::text[])`, 1, 50),
    remoteFeed(me, 50),
    listFollowing(me),
  ])
  const items = [
    ...local.map(p => ({ at: p.createdAt, el: <PostCard key={`l${p.id}`} post={p} lang={lang} /> })),
    ...remote.map(p => ({ at: p.publishedAt, el: <RemoteCard key={p.objectId} post={p} /> })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 50)
  return (
    <div className="flex flex-col gap-3">
      <RemoteFollow following={[...following]} lang={lang} />
      {items.length === 0 ? <p className="opacity-60">{t(lang, 'feed.empty')}</p> : items.map(i => i.el)}
    </div>
  )
}
