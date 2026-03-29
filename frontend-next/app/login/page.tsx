"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setCookie } from "@/lib/auth"
import { wifIsValid, wifToPublic, findAccountsByKey, getAccount } from "@/lib/viz"
import { useViz } from "@/contexts/VizContext"

export default function LoginPage() {
  const [wif, setWif] = useState("")
  const [accountName, setAccountName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { ready, refreshAccount } = useViz()

  async function handleLogin() {
    setError("")
    if (!wif.startsWith("5") || !wifIsValid(wif)) {
      setError("Invalid private key format")
      return
    }

    setLoading(true)
    try {
      const publicKey = wifToPublic(wif)
      let login = accountName.trim().toLowerCase()

      if (!login) {
        const accounts = await findAccountsByKey(publicKey)
        if (!accounts || accounts.length === 0) {
          setError("No account found for this key")
          setLoading(false)
          return
        }
        login = accounts[0]
      }

      const account = await getAccount(login)
      if (!account) {
        setError("Account not found")
        setLoading(false)
        return
      }

      const threshold = account.regular_authority.weight_threshold
      const keyAuths = account.regular_authority.key_auths
      const hasAuth = keyAuths.some(
        ([key, weight]: [string, number]) => key === publicKey && weight >= threshold
      )

      if (!hasAuth) {
        setError("Key does not have sufficient authority")
        setLoading(false)
        return
      }

      setCookie("login", login)
      setCookie("regular", wif)

      try {
        const meta = JSON.parse(account.json_metadata || "{}")
        if (meta.profile?.avatar) {
          setCookie("avatar", meta.profile.avatar)
        }
      } catch {}

      await refreshAccount()
      router.push("/")
    } catch (err: any) {
      setError(err?.message || "Login failed")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-xl font-bold mb-6">Log In</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Private regular key
          </label>
          <input
            type="password"
            value={wif}
            onChange={(e) => setWif(e.target.value)}
            placeholder="5..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Account name (optional, auto-detected from key)
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="account"
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800"
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          onClick={handleLogin}
          disabled={loading || !ready || !wif}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </div>
    </div>
  )
}
