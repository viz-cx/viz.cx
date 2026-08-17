import type { ObjectId } from 'mongodb'
export type Lang = 'en' | 'ru'
export interface EditorBlock { id?: string; type: string; data: Record<string, unknown> }
export interface EditorDoc { time?: number; version?: string; blocks: EditorBlock[] }
export interface Post {
  _id?: ObjectId; author: string; slug: string; lang: Lang; title: string
  blocks: EditorDoc; tags: string[]; excerpt: string; coverImage?: string
  status: 'draft' | 'published'; createdAt: Date; updatedAt: Date; deletedAt?: Date
}
export interface CommentDoc { _id?: ObjectId; postId: ObjectId; author: string; parentId?: ObjectId; body: string; createdAt: Date; deletedAt?: Date }
export interface Follow { follower: string; following: string; createdAt: Date }
export interface Profile { account: string; about?: string; preferredLang?: Lang; createdAt: Date }
export interface Session { tokenHash: string; account: string; createdAt: Date; expiresAt: Date }
export interface Nonce { nonce: string; account: string; createdAt: Date }
