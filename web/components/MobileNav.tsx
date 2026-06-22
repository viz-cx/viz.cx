'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NAV } from '@/lib/nav'

/** Hamburger menu shown below the `lg` breakpoint; the desktop nav is hidden there. */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
      >
        <span className="text-lg leading-none">{open ? '×' : '≡'}</span>
      </button>

      {open && (
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <nav className="absolute right-2 top-14 z-40 flex w-44 flex-col rounded-lg border border-border bg-surface py-1 shadow-xl">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="px-4 py-2 font-prose text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  )
}
