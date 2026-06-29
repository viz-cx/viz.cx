'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV, isNavActive } from '@/lib/nav'

/** Desktop nav (≥lg); the active route's label is styled as if hovered. */
export function DesktopNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {NAV.map((n) => {
        const active = isNavActive(pathname, n.href)
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 font-prose text-sm hover:bg-surface-2 hover:text-fg ${
              active ? 'bg-surface-2 text-fg' : 'text-fg-muted'
            }`}
          >
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}
