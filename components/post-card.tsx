import Link from 'next/link'
import { langHref } from '@/lib/i18n'
import type { Lang, Post } from '@/lib/types'
export default function PostCard({ post, lang }: { post: Post; lang: Lang }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <Link href={langHref(lang, `/@${post.author}/${post.slug}`)} className="font-semibold">{post.title}</Link>
      {post.excerpt && <p className="mt-1 text-sm opacity-75">{post.excerpt}</p>}
      <p className="mt-2 text-xs opacity-60">
        <Link href={langHref(lang, `/@${post.author}`)}>@{post.author}</Link> · {post.createdAt.toISOString().slice(0, 10)}
        {post.tags.map(t => <span key={t} className="ml-2">#{t}</span>)}
      </p>
    </div>
  )
}
