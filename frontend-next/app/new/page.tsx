"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { isAuthenticated, getLogin, getWif } from "@/lib/auth"
import { wifToPublic } from "@/lib/viz"
import { apiFetch } from "@/lib/api"

const EditorComponent = dynamic(() => import("@/components/EditorComponent"), {
  ssr: false,
  loading: () => <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] text-gray-400">Loading editor...</div>,
})

export default function NewPostPage() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit() {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    if (blocks.length === 0) {
      alert("Write something first")
      return
    }

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
        body: JSON.stringify({ blocks }),
      })
      router.push("/")
    } catch (err: any) {
      alert(err?.message || "Failed to create post")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto mt-4">
      <h1 className="text-lg font-bold mb-4">New Post</h1>
      <EditorComponent onChange={setBlocks} />
      <button
        onClick={submit}
        disabled={loading || blocks.length === 0}
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Publishing..." : "Publish"}
      </button>
    </div>
  )
}
