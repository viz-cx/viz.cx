import { isLang } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import Header from '@/components/header'
import { WalletProvider } from '@/lib/wallet'
import { getSessionAccount } from '@/lib/session'
export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const account = await getSessionAccount()
  return (
    <WalletProvider>
      <Header lang={lang} account={account} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </WalletProvider>
  )
}
