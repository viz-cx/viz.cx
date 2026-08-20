import Link from 'next/link'
import { t, langHref } from '@/lib/i18n'
import type { Lang } from '@/lib/types'
import LogoutButton from './logout-button'
export default function Header({ lang, account }: { lang: Lang; account: string | null }) {
  const other: Lang = lang === 'en' ? 'ru' : 'en'
  return (
    <header className="border-b border-neutral-800">
      <nav className="mx-auto max-w-4xl flex items-center gap-4 px-4 py-3">
        <Link href={langHref(lang, '/')} className="font-bold">viz.cx</Link>
        <Link href={langHref(lang, '/')}>{t(lang, 'nav.latest')}</Link>
        <Link href={langHref(lang, '/feed')}>{t(lang, 'nav.feed')}</Link>
        <span className="ml-auto" />
        <Link href={langHref(lang, '/write')}>{t(lang, 'nav.write')}</Link>
        <Link href={langHref(other, '/')}>{other.toUpperCase()}</Link>
        {account ? (
          <>
            <span className="text-neutral-400">@{account}</span>
            <LogoutButton lang={lang} />
          </>
        ) : (
          <Link href={langHref(lang, '/login')}>{t(lang, 'nav.login')}</Link>
        )}
      </nav>
    </header>
  )
}
