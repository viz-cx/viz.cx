import type { Fragment } from 'postgres'
import { sql } from './db'
import type { Lang, Post } from './types'
export function parseHandle(seg: string): string | null {
  const s = decodeURIComponent(seg)
  if (!s.startsWith('@')) return null
  const name = s.slice(1)
  return /^[a-z0-9.-]{2,25}$/.test(name) ? name : null
}
// Compose with sql`${publicPostFilter(lang)} and author = ${a}`.
export const publicPostFilter = (lang: Lang): Fragment => sql`lang = ${lang} and status = 'published' and deleted_at is null`
export const getPost = async (author: string, slug: string, lang: Lang): Promise<Post | null> => {
  const [p] = await sql<Post[]>`select * from posts where author = ${author} and slug = ${slug} and ${publicPostFilter(lang)}`
  return p ?? null
}
export const listPosts = (where: Fragment, page: number, per = 20) =>
  sql<Post[]>`select * from posts where ${where} order by created_at desc limit ${per} offset ${(page - 1) * per}`
