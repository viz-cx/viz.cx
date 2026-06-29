export interface NavItem {
  href: string
  label: string
}

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Network' },
  { href: '/validators', label: 'Validators' },
  { href: '/committee', label: 'Committee' },
  { href: '/richlist', label: 'Richlist' },
  { href: '/dev', label: 'Docs' },
  { href: '/learn', label: 'Learn' },
]

/** Whether a nav item matches the current pathname (exact, or a sub-route). */
export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}
