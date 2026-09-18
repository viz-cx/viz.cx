import Link from 'next/link'
import { sql } from '@/lib/db'
import type { CommentDoc, Lang } from '@/lib/types'
import { t, langHref } from '@/lib/i18n'
import { CommentForm, ReplyToggle } from './comment-form'

function CommentItem({ c }: { c: CommentDoc }) {
  return (
    <div className="rounded border border-neutral-800 p-3">
      {/* Remote handle is text only: no profile link, no avatar — nothing
          remote is fetched or stored, so CSP img-src stays 'self' data:. */}
      <p className="text-xs opacity-60">
        {c.remoteActor ? c.remoteHandle : `@${c.author}`} · {c.createdAt.toISOString().slice(0, 10)}
      </p>
      <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
    </div>
  )
}

export default async function Comments({ postId, lang, me }: { postId: string; lang: Lang; me: string | null }) {
  const all = await sql<CommentDoc[]>`select * from comments where post_id = ${postId} and deleted_at is null order by created_at`
  const top = all.filter(c => c.parentId === null)
  const repliesOf = (id: string) => all.filter(c => c.parentId === id)
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{t(lang, 'post.comments')}</h2>
      {me
        ? <CommentForm postId={postId} lang={lang} />
        : <p className="mt-2 text-sm"><Link href={langHref(lang, '/login')} className="underline">{t(lang, 'comments.login')}</Link></p>}
      <div className="mt-4 flex flex-col gap-4">
        {top.map(c => (
          <div key={c.id}>
            <CommentItem c={c} />
            {me && <ReplyToggle postId={postId} parentId={c.id} lang={lang} />}
            <div className="ml-8 mt-2 flex flex-col gap-2">
              {repliesOf(c.id).map(r => <CommentItem key={r.id} c={r} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
