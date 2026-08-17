'use client'
import { useState } from 'react'
import { t } from '@/lib/i18n'
import type { Lang } from '@/lib/types'
export default function FollowButton({ following, initial, lang }: { following: string; initial: boolean; lang: Lang }) {
  const [on, setOn] = useState(initial)
  async function toggle() {
    setOn(!on)
    const res = await fetch('/api/follows', { method: on ? 'DELETE' : 'POST', body: JSON.stringify({ following }) })
    if (!res.ok) setOn(on) // revert on failure
  }
  return <button onClick={toggle} className="rounded border border-neutral-700 px-3 py-1 text-sm">{on ? t(lang, 'post.unfollow') : t(lang, 'post.follow')}</button>
}
