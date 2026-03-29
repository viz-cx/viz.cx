"use client"

import { useState, useEffect } from "react"
import { Post } from "@/types"
import { apiFetch } from "@/lib/api"
import PostCard from "./PostCard"
import Spinner from "./Spinner"

interface PostListProps {
  tab: string
  author?: string
}

export default function PostList({ tab, author }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  async function loadPosts(pageNum: number, append = false) {
    setLoading(true)
    try {
      const path = author
        ? `/posts/${tab}/${author}/${pageNum}`
        : `/posts/${tab}/${pageNum}`
      const data = await apiFetch<Post[]>(path)
      if (append) {
        setPosts((prev) => [...prev, ...data])
      } else {
        setPosts(data)
      }
      setHasMore(data.length >= 10)
    } catch {
      setHasMore(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    setPage(0)
    setPosts([])
    loadPosts(0)
  }, [tab, author])

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    loadPosts(nextPage, true)
  }

  if (loading && posts.length === 0) {
    return <Spinner />
  }

  if (posts.length === 0) {
    return <div className="text-center text-gray-500 py-8">No posts yet</div>
  }

  return (
    <div>
      {posts.map((post, i) => (
        <PostCard key={`${post.author}-${post.block}-${i}`} post={post} />
      ))}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          {loading ? "Loading..." : "show more"}
        </button>
      )}
    </div>
  )
}
