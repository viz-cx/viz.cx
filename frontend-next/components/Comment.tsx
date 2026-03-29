"use client"

import { useState } from "react"
import Link from "next/link"
import { Comment as CommentType } from "@/types"
import { timeAgo } from "@/lib/time"
import { highlight_links } from "@/lib/markdown"
import AwardButton from "./AwardButton"
import CommentEditor from "./CommentEditor"

interface CommentProps {
  comment: CommentType
  depth?: number
}

export default function Comment({ comment, depth = 0 }: CommentProps) {
  const [showReply, setShowReply] = useState(false)
  const [replies, setReplies] = useState(comment.replies || [])

  function onReplyCreated(text: string) {
    setShowReply(false)
    const fake: CommentType = {
      author: "you",
      block: 0,
      d: { t: text },
      timestamp: new Date().toISOString(),
      shares: 0,
      awards: 0,
      comments: 0,
    }
    setReplies((prev) => [fake, ...prev])
  }

  return (
    <div className={`${depth > 0 ? "ml-4 border-l border-gray-200 dark:border-gray-700 pl-3" : ""} py-2`}>
      <div className="text-xs text-gray-500 mb-1">
        <Link href={`/@${comment.author}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500">
          {comment.author}
        </Link>
        {" · "}
        <span title={comment.timestamp + "Z"}>{timeAgo(comment.timestamp + "Z")}</span>
      </div>
      <div
        className="text-sm mb-1"
        dangerouslySetInnerHTML={{
          __html: highlight_links((comment.d.t || "").replace(/\r\n/g, "\n"), false),
        }}
      />
      <div className="flex items-center gap-3 text-xs">
        <AwardButton
          author={comment.author}
          memo={`viz://@${comment.author}/${comment.block}`}
          awards={comment.awards || 0}
          shares={comment.shares || 0}
        />
        <button
          onClick={() => setShowReply(!showReply)}
          className="text-gray-500 hover:text-blue-500"
        >
          reply
        </button>
      </div>
      {showReply && (
        <div className="mt-2">
          <CommentEditor
            reply={`viz://@${comment.author}/${comment.block}`}
            onSuccess={onReplyCreated}
          />
        </div>
      )}
      {replies.map((reply, i) => (
        <Comment key={`${reply.author}-${reply.block}-${i}`} comment={reply} depth={depth + 1} />
      ))}
    </div>
  )
}
