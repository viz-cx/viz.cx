import { notFound } from 'next/navigation'
import { isLang } from '@/lib/i18n'
import { parseHandle, publicPostFilter, listPosts } from '@/lib/queries'
import { getSessionAccount } from '@/lib/session'
import { follows } from '@/lib/db'
import PostCard from '@/components/post-card'
import FollowButton from '@/components/follow-button'
export default async function ProfilePage({ params }: { params: Promise<{ lang: string; handle: string }> }) {
  const { lang, handle } = await params
  if (!isLang(lang)) notFound()
  const author = parseHandle(handle)
  if (!author) notFound()
  const me = await getSessionAccount()
  const items = await listPosts({ ...publicPostFilter(lang), author }, 1, 50)
  const drafts = me === author ? await listPosts({ author, lang, status: 'draft', deletedAt: { $exists: false } }, 1, 50) : []
  const initial = me && me !== author ? !!(await follows().findOne({ follower: me, following: author })) : false
  return (
    <div>
      <h1 className="text-2xl font-bold">@{author}</h1>
      {me && me !== author && <FollowButton following={author} initial={initial} lang={lang} />}
      <div className="mt-6 flex flex-col gap-3">{items.map(p => <PostCard key={String(p._id)} post={p} lang={lang} />)}</div>
      {drafts.length > 0 && <><h2 className="mt-8 font-semibold opacity-60">Drafts</h2>
        <div className="mt-2 flex flex-col gap-3">{drafts.map(p => <PostCard key={String(p._id)} post={p} lang={lang} linked={false} />)}</div></>}
    </div>
  )
}
