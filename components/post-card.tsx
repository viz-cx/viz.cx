import Link from 'next/link'
import { langHref } from '@/lib/i18n'
import type { Lang, Post } from '@/lib/types'
export default function PostCard({ post, lang, linked = true }: { post: Post; lang: Lang; linked?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      {linked
        ? <Link href={langHref(lang, `/@${post.author}/${post.slug}`)} className="font-semibold">{post.title}</Link>
        : <span className="font-semibold">{post.title}</span>}
      {post.excerpt && <p className="mt-1 text-sm opacity-75">{post.excerpt}</p>}
      <p className="mt-2 text-xs opacity-60">
        <Link href={langHref(lang, `/@${post.author}`)}>@{post.author}</Link> · {post.createdAt.toISOString().slice(0, 10)}
        {post.tags.map(t => <span key={t} className="ml-2">#{t}</span>)}
      </p>
    </div>
  )
}
