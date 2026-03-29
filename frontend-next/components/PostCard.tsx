"use client"

import Link from "next/link"
import { Post } from "@/types"
import { timeAgo } from "@/lib/time"
import { voiceLink } from "@/lib/links"

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const title = post.d.t?.substring(0, 120) || "Untitled"
  const isReply = !!post.d.r
  const postUrl = `/@${post.author}/${post.block}`

  return (
    <div className="flex gap-3 py-2 px-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <div className="flex flex-col items-center text-xs text-gray-500 min-w-[50px]">
        <span title="awards">{post.awards || 0} pts</span>
        <span className="text-gray-400">{(post.shares || 0).toFixed(2)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div>
          <Link href={postUrl} className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
            {title.length >= 120 ? title + "..." : title}
          </Link>
          {post.d.s && (
            <span className="text-xs text-gray-400 ml-2">
              (<a href={post.d.s} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">link</a>)
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {isReply && (
            <span>
              reply to{" "}
              <Link href={voiceLink(post.d.r!)} className="text-gray-500 hover:text-blue-500">
                {voiceLink(post.d.r!, false)}
              </Link>
              {" · "}
            </span>
          )}
          by{" "}
          <Link href={`/@${post.author}`} className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
            {post.author}
          </Link>
          {" · "}
          <span title={post.timestamp + "Z"}>{timeAgo(post.timestamp + "Z")}</span>
          {" · "}
          <Link href={`${postUrl}#comments`} className="text-gray-500 hover:text-blue-500">
            {post.comments || 0} comments
          </Link>
        </div>
      </div>
    </div>
  )
}
