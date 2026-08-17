import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isLang, langHref } from '@/lib/i18n'
import { parseHandle, getPost } from '@/lib/queries'
import { renderBlocks } from '@/lib/render'
import { getSessionAccount } from '@/lib/session'
import Comments from '@/components/comments'
import Link from 'next/link'
type Params = Promise<{ lang: string; handle: string; slug: string }>
async function load(params: Params) {
  const { lang, handle, slug } = await params
  if (!isLang(lang)) return null
  const author = parseHandle(handle)
  if (!author) return null
  const post = await getPost(author, slug, lang)
  return post ? { post, lang } : null
}
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await load(params)
  if (!r) return {}
  const url = `${process.env.SITE_URL ?? 'https://viz.cx'}${langHref(r.lang, `/@${r.post.author}/${r.post.slug}`)}`
  return { title: r.post.title, description: r.post.excerpt,
    openGraph: { title: r.post.title, description: r.post.excerpt, url, type: 'article', ...(r.post.coverImage ? { images: [r.post.coverImage] } : {}) } }
}
export default async function PostPage({ params }: { params: Params }) {
  const r = await load(params)
  if (!r) notFound()
  const { post, lang } = r
  const me = await getSessionAccount()
  return (
    <article>
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="mt-1 text-sm opacity-60">
        <Link href={langHref(lang, `/@${post.author}`)}>@{post.author}</Link> · {post.createdAt.toISOString().slice(0, 10)}
      </p>
      <div className="prose prose-invert mt-6" dangerouslySetInnerHTML={{ __html: renderBlocks(post.blocks) }} />
      <p className="mt-6 text-sm opacity-60">{post.tags.map(t => <Link key={t} href={langHref(lang, `/tag/${t}`)} className="mr-2">#{t}</Link>)}</p>
      {/* AwardButton (Task 11) mounts here */}
      <Comments postId={post._id!} lang={lang} me={me} />
    </article>
  )
}
