import { redirect, notFound } from 'next/navigation'
import { isLang } from '@/lib/i18n'
import { getSessionAccount } from '@/lib/session'
import { langHref } from '@/lib/i18n'
import Editor from '@/components/editor'

export default async function WritePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const account = await getSessionAccount()
  if (!account) redirect(langHref(lang, '/login'))
  return <Editor lang={lang} />
}
