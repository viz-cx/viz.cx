import { notFound } from 'next/navigation'
import { isLang } from '@/lib/i18n'
import LoginForm from '@/components/login-form'

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <LoginForm lang={lang} />
}
