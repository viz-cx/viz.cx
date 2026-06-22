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
