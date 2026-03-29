"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { getCookie, setCookie, isAuthenticated, getAvatar } from "@/lib/auth"
import Sidebar from "./Sidebar"

export default function Navbar() {
  const [dark, setDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [login, setLogin] = useState("")
  const [avatar, setAvatar] = useState<string | undefined>()

  useEffect(() => {
    const theme = getCookie("theme")
    const isDark = theme === "dark"
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
    setLoggedIn(isAuthenticated())
    setLogin(getCookie("login") || "")
    setAvatar(getAvatar())
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    setCookie("theme", next ? "dark" : "light")
    document.documentElement.classList.toggle("dark", next)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="text-xl" aria-label="menu">
          &#9776;
        </button>
        <Link href="/" className="font-bold text-lg text-gray-900 dark:text-white no-underline">
          VIZ.cx
        </Link>
        <div className="flex-1" />
        <Link
          href="/new"
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 no-underline"
        >
          + New Post
        </Link>
        {loggedIn ? (
          <Link href={`/@${login}`} className="text-sm text-gray-700 dark:text-gray-300 no-underline">
            {avatar && (
              <img src={avatar} alt="" className="inline w-6 h-6 rounded-full mr-1" />
            )}
            {login}
          </Link>
        ) : (
          <Link href="/login" className="text-sm text-blue-600 dark:text-blue-400 no-underline">
            Log In
          </Link>
        )}
        <button onClick={toggleTheme} className="text-lg" aria-label="toggle theme">
          {dark ? "☀️" : "🌙"}
        </button>
      </nav>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} login={login} loggedIn={loggedIn} />
    </>
  )
}
