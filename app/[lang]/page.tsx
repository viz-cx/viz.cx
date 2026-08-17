import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLang, langHref, t } from '@/lib/i18n'
import { listPosts, publicPostFilter } from '@/lib/queries'
import PostCard from '@/components/post-card'
export default async function Home({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ page?: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const page = Number((await searchParams).page ?? 1)
  const items = await listPosts(publicPostFilter(lang), page)
  return (
    <div className="flex flex-col gap-3">
      {items.map(p => <PostCard key={String(p._id)} post={p} lang={lang} />)}
      {items.length === 20 && <Link href={langHref(lang, `/?page=${page + 1}`)} className="mt-4 text-sm opacity-75">{t(lang, 'nav.older')}</Link>}
    </div>
  )
}
