"use client"

import Link from "next/link"

interface SidebarProps {
  open: boolean
  onClose: () => void
  login: string
  loggedIn: boolean
}

export default function Sidebar({ open, onClose, login, loggedIn }: SidebarProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-50 shadow-lg p-4">
        <div className="mb-4">
          {loggedIn ? (
            <div>
              <div className="font-bold">{login}</div>
              <Link href="/logout" className="text-sm text-gray-500" onClick={onClose}>
                Log out
              </Link>
            </div>
          ) : (
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold" onClick={onClose}>
              Log In / Sign Up
            </Link>
          )}
        </div>
        <hr className="border-gray-200 dark:border-gray-700 mb-3" />
        <nav className="flex flex-col gap-2">
          <Link href="/" className="hover:text-blue-600" onClick={onClose}>Home</Link>
          <Link href="/new" className="hover:text-blue-600" onClick={onClose}>New Post</Link>
          {loggedIn && (
            <Link href={`/@${login}`} className="hover:text-blue-600" onClick={onClose}>My Posts</Link>
          )}
        </nav>
        <div className="absolute bottom-4 text-xs text-gray-400">
          <a href="https://github.com/viz-cx/viz.cx" target="_blank" rel="noopener noreferrer">GitHub</a>
          {" · "}
          <a href="https://t.me/viz_cx" target="_blank" rel="noopener noreferrer">Telegram</a>
        </div>
      </div>
    </>
  )
}
