"use client"

import { useState } from "react"
import { apiFetch } from "@/lib/api"
import { isAuthenticated, getLogin, getWif } from "@/lib/auth"
import { wifToPublic } from "@/lib/viz"

interface CommentEditorProps {
  reply: string
  onSuccess: (text: string) => void
}

export default function CommentEditor({ reply, onSuccess }: CommentEditorProps) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!isAuthenticated()) {
      window.location.href = "/login"
      return
    }
    if (text.trim().length < 3) return

    setLoading(true)
    try {
      const login = getLogin()
      const wif = getWif()
      const publicKey = wifToPublic(wif)
      await apiFetch("/posts/", {
        method: "POST",
        headers: {
          "x-login": login,
          "x-public-key": publicKey,
        },
        body: JSON.stringify({
          blocks: [{ type: "paragraph", data: { text: text.trim() } }],
          reply,
        }),
      })
      onSuccess(text.trim())
      setText("")
    } catch (err: any) {
      alert(err?.message || "Failed to post comment")
    }
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        rows={2}
        className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 resize-none"
      />
      <button
        onClick={submit}
        disabled={loading || text.trim().length < 3}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 self-end"
      >
        {loading ? "..." : "Reply"}
      </button>
    </div>
  )
}
