"use client"

import { useState, use } from "react"
import PostList from "@/components/PostList"

const TABS = [
  { key: "newest", label: "new" },
  { key: "popular", label: "top" },
  { key: "replies", label: "replies" },
]

export default function UserPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [tab, setTab] = useState("newest")

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold">@{name}</h1>
      </div>
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-2 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-2 px-1 border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <PostList tab={tab} author={name} />
    </div>
  )
}
