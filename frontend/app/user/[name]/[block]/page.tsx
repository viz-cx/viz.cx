"use client"

import { useState, useEffect, use } from "react"
import { Post, Comment as CommentType } from "@/types"
import { apiFetch } from "@/lib/api"
import PostRenderer from "@/components/PostRenderer"
import AwardButton from "@/components/AwardButton"
import Comment from "@/components/Comment"
import CommentEditor from "@/components/CommentEditor"
import Spinner from "@/components/Spinner"
import { timeAgo } from "@/lib/time"
import { voiceLink } from "@/lib/links"
import Link from "next/link"

export default function PostDetailPage({ params }: { params: Promise<{ name: string; block: string }> }) {
  const { name, block } = use(params)
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<CommentType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [p, c] = await Promise.all([
          apiFetch<Post>(`/posts/@${name}/${block}`),
          apiFetch<CommentType[]>(`/posts/comments/@${name}/${block}`),
        ])
        setPost(p)
        setComments(c || [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [name, block])

  if (loading) return <Spinner />
  if (!post) return <div className="text-center py-8 text-gray-500">Post not found</div>

  function onCommentCreated(text: string) {
    const fake: CommentType = {
      author: "you",
      block: 0,
      d: { t: text },
      timestamp: new Date().toISOString(),
      shares: 0,
      awards: 0,
      comments: 0,
    }
    setComments((prev) => [fake, ...prev])
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">
          <Link href={`/@${post.author}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500">
            {post.author}
          </Link>
          {" · "}
          <span title={post.timestamp + "Z"}>{timeAgo(post.timestamp + "Z")}</span>
          {post.d.r && (
            <span>
              {" · "}reply to{" "}
              <Link href={voiceLink(post.d.r)} className="hover:text-blue-500">{voiceLink(post.d.r, false)}</Link>
            </span>
          )}
          {post.d.s && (
            <span>
              {" · "}
              <a href={post.d.s} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">shared link</a>
            </span>
          )}
        </div>

        <div className="mb-3">
          <PostRenderer post={post} full />
        </div>

        {post.d.i && (
          <img src={post.d.i} alt="" className="max-w-full rounded mb-3" />
        )}

        <div className="flex items-center gap-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <AwardButton
            author={post.author}
            memo={`viz://@${post.author}/${post.block}`}
            awards={post.awards || 0}
            shares={post.shares || 0}
          />
        </div>
      </div>

      <div id="comments" className="mt-6">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
          Comments ({comments.length})
        </h2>
        <div className="mb-4">
          <CommentEditor
            reply={`viz://@${post.author}/${post.block}`}
            onSuccess={onCommentCreated}
          />
        </div>
        {comments.map((comment, i) => (
          <Comment key={`${comment.author}-${comment.block}-${i}`} comment={comment} />
        ))}
      </div>
    </div>
  )
}
