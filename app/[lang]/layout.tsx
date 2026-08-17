import { isLang } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import Header from '@/components/header'
export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return (<><Header lang={lang} /><main className="mx-auto max-w-2xl px-4 py-6">{children}</main></>)
}
