import Link from 'next/link'

const LINKS = [
  { href: '/dev', label: 'Overview' },
  { href: '/dev/rpc', label: 'RPC' },
  { href: '/dev/rest', label: 'REST' },
  { href: '/dev/sdk', label: 'SDK' },
  { href: '/dev/playground', label: 'Playground' },
]

export function DocNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-3">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3 py-1 rounded text-xs font-mono ${
            active === l.href
              ? 'bg-surface-2 text-fg border border-border-strong'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
