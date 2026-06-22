'use client'
import { useEffect, useId, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Tailwind max-width class for the dialog box. Default 'max-w-sm'. */
  maxWidth?: string
}

/**
 * Shared modal chrome: full-screen overlay, centered dialog box, title + close
 * header, Escape-to-close, click-outside-to-close. Fits the viewport on small
 * screens (overlay padding + max-height scroll). Each modal supplies its own body
 * and keeps its own state/reset effects.
 */
export function ModalShell({ open, onClose, title, children, maxWidth = 'max-w-sm' }: Props) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="font-prose text-base font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="text-xl leading-none text-fg-dim hover:text-fg" aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
