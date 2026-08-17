'use client'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet'
import { t } from '@/lib/i18n'
import type { Lang } from '@/lib/types'

export default function LogoutButton({ lang }: { lang: Lang }) {
  const router = useRouter()
  const { logout } = useWallet()
  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' })
    await logout()
    router.refresh()
  }
  return <button onClick={handleLogout} className="text-neutral-400 hover:text-white">{t(lang, 'nav.logout')}</button>
}
