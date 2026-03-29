"use client"

import { Post } from "@/types"
import { markdown, highlight_links } from "@/lib/markdown"

interface PostRendererProps {
  post: Post
  full?: boolean
}

export default function PostRenderer({ post, full = false }: PostRendererProps) {
  if (post.blocks && post.blocks.length > 0) {
    return <EditorJSRenderer blocks={post.blocks} />
  }

  if (post.t === "p" && post.d.m) {
    return (
      <div className="article">
        {full ? (
          <div dangerouslySetInnerHTML={{ __html: markdown(post.d.m) }} />
        ) : (
          <span>{post.d.d || post.d.t?.substring(0, 280) || ""}</span>
        )}
      </div>
    )
  }

  const text = post.d.t || ""
  if (!full && text.length > 280) {
    return <span>{text.substring(0, 280)}...</span>
  }

  return (
    <div
      className="article"
      dangerouslySetInnerHTML={{
        __html: highlight_links(text.replace(/\r\n/g, "\n"), false),
      }}
    />
  )
}

function EditorJSRenderer({ blocks }: { blocks: any[] }) {
  return (
    <div className="article">
      {blocks.map((block, i) => (
        <EditorJSBlock key={i} block={block} />
      ))}
    </div>
  )
}

function EditorJSBlock({ block }: { block: any }) {
  const { type, data } = block

  switch (type) {
    case "paragraph":
      return <p dangerouslySetInnerHTML={{ __html: data.text || "" }} />
    case "header": {
      const level = data.level || 2
      if (level === 2) return <h2 className="font-bold text-lg mt-3 mb-1">{data.text}</h2>
      return <h3 className="font-bold mt-3 mb-1">{data.text}</h3>
    }
    case "list":
      const ListTag = data.style === "ordered" ? "ol" : "ul"
      return (
        <ListTag className={data.style === "ordered" ? "list-decimal pl-6" : "list-disc pl-6"}>
          {(data.items || []).map((item: string, i: number) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ListTag>
      )
    case "image":
      return (
        <figure className="my-2">
          <img src={data.file?.url || data.url} alt={data.caption || ""} className="max-w-full" />
          {data.caption && <figcaption className="text-sm text-gray-500 mt-1">{data.caption}</figcaption>}
        </figure>
      )
    case "quote":
      return (
        <blockquote className="border-l-3 border-gray-400 pl-4 italic my-2 text-gray-600 dark:text-gray-400">
          <p dangerouslySetInnerHTML={{ __html: data.text || "" }} />
        </blockquote>
      )
    case "delimiter":
      return <hr className="my-4" />
    case "code":
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto my-2">
          <code>{data.code}</code>
        </pre>
      )
    default:
      if (data?.text) {
        return <p dangerouslySetInnerHTML={{ __html: data.text }} />
      }
      return null
  }
}
