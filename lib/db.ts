import { MongoClient, type Db, type Collection } from 'mongodb'
import postgres from 'postgres'
import type { Post, CommentDoc, Follow, Profile, Session, Nonce } from './types'
import { SCHEMA } from './schema'

declare global { var _mongoClient: MongoClient | undefined; var _sql: ReturnType<typeof postgres> | undefined }

// postgres.js: lazy connect, pooled. transform.column rewrites column names in
// results to camelCase (created_at → createdAt) — static SQL text is NOT
// rewritten, so queries are written in snake_case. int8 arrives as string.
// NOTE: postgres.camel (the preset) also deep-transforms jsonb VALUE keys
// (with_border → withBorder), which corrupts stored Editor.js block data —
// use the column-only form so jsonb contents pass through untouched.
export const sql = globalThis._sql ?? postgres(process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres', { transform: { column: { from: postgres.toCamel, to: postgres.fromCamel } }, max: 10 })
if (process.env.NODE_ENV !== 'production') globalThis._sql = sql

// Idempotent DDL (create ... if not exists). Multi-statement string → simple protocol.
export async function ensureSchema(): Promise<void> { await sql.unsafe(SCHEMA) }

// --- Mongo: removed in the final cleanup task ---
const client = globalThis._mongoClient ?? new MongoClient(process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017')
if (process.env.NODE_ENV !== 'production') globalThis._mongoClient = client
export const db: Db = client.db(process.env.MONGO_DB ?? 'viz_platform')
export const posts = (): Collection<Post> => db.collection('posts')
export const comments = (): Collection<CommentDoc> => db.collection('comments')
export const follows = (): Collection<Follow> => db.collection('follows')
export const profiles = (): Collection<Profile> => db.collection('profiles')
export const sessions = (): Collection<Session> => db.collection('sessions')
export const nonces = (): Collection<Nonce> => db.collection('nonces')
