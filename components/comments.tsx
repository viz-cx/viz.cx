import type { ObjectId } from 'mongodb'
import Link from 'next/link'
import { comments } from '@/lib/db'
import type { CommentDoc, Lang } from '@/lib/types'
import { t, langHref } from '@/lib/i18n'
import { CommentForm, ReplyToggle } from './comment-form'

function CommentItem({ c }: { c: CommentDoc }) {
  return (
    <div className="rounded border border-neutral-800 p-3">
      <p className="text-xs opacity-60">@{c.author} · {c.createdAt.toISOString().slice(0, 10)}</p>
      <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
    </div>
  )
}

export default async function Comments({ postId, lang, me }: { postId: ObjectId; lang: Lang; me: string | null }) {
  const all = await comments().find({ postId, deletedAt: { $exists: false } }).sort({ createdAt: 1 }).toArray()
  const top = all.filter(c => !c.parentId)
  const repliesOf = (id: ObjectId) => all.filter(c => c.parentId?.equals(id))
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{t(lang, 'post.comments')}</h2>
      {me
        ? <CommentForm postId={String(postId)} lang={lang} />
        : <p className="mt-2 text-sm"><Link href={langHref(lang, '/login')} className="underline">{t(lang, 'comments.login')}</Link></p>}
      <div className="mt-4 flex flex-col gap-4">
        {top.map(c => (
          <div key={String(c._id)}>
            <CommentItem c={c} />
            {me && <ReplyToggle postId={String(postId)} parentId={String(c._id)} lang={lang} />}
            <div className="ml-8 mt-2 flex flex-col gap-2">
              {repliesOf(c._id!).map(r => <CommentItem key={String(r._id)} c={r} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
