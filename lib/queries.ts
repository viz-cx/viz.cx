import { posts } from './db'
import type { Lang, Post } from './types'
import type { Filter } from 'mongodb'
export function parseHandle(seg: string): string | null {
  const s = decodeURIComponent(seg)
  if (!s.startsWith('@')) return null
  const name = s.slice(1)
  return /^[a-z0-9.-]{2,25}$/.test(name) ? name : null
}
export const publicPostFilter = (lang: Lang): Filter<Post> => ({ lang, status: 'published', deletedAt: { $exists: false } })
export const getPost = (author: string, slug: string, lang: Lang) =>
  posts().findOne({ author, slug, ...publicPostFilter(lang) })
export const listPosts = (filter: Filter<Post>, page: number, per = 20) =>
  posts().find(filter).sort({ createdAt: -1 }).skip((page - 1) * per).limit(per).toArray()
