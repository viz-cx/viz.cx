import postgres from 'postgres'
import { SCHEMA } from './schema'

declare global { var _sql: ReturnType<typeof postgres> | undefined }

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
