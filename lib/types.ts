export type Lang = 'en' | 'ru'
export interface EditorBlock { id?: string; type: string; data: Record<string, unknown> }
export interface EditorDoc { time?: number; version?: string; blocks: EditorBlock[] }
// Rows as postgres.js returns them (camelCase columns, int8 → string, null for empty).
export interface Post {
  id: string; author: string; slug: string; lang: Lang; title: string
  blocks: EditorDoc; tags: string[]; excerpt: string; coverImage: string | null
  status: 'draft' | 'published'; createdAt: Date; updatedAt: Date; deletedAt: Date | null
}
export interface CommentDoc { id: string; postId: string; author: string; parentId: string | null; body: string; createdAt: Date; deletedAt: Date | null }
export interface Follow { follower: string; following: string; createdAt: Date }
export interface Profile { account: string; about: string | null; preferredLang: Lang | null; createdAt: Date }
