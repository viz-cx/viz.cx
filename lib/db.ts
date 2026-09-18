import postgres from 'postgres'
import { SCHEMA } from './schema'

declare global { var _sql: ReturnType<typeof postgres> | undefined; var _fedifySql: ReturnType<typeof postgres> | undefined }

const URL_ = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres'

// The globalThis cache below survives Next dev HMR, which would otherwise leak a
// pool per edit. Under vitest it does the opposite: test files get a fresh module
// registry but share the worker's globalThis, so the first file to call sql.end()
// hands every later file an already-closed pool. No HMR in tests — skip it.
const CACHE = process.env.NODE_ENV !== 'production' && !process.env.VITEST

// postgres.js: lazy connect, pooled. transform.column rewrites column names in
// results to camelCase (created_at → createdAt) — static SQL text is NOT
// rewritten, so queries are written in snake_case. int8 arrives as string.
// NOTE: postgres.camel (the preset) also deep-transforms jsonb VALUE keys
// (with_border → withBorder), which corrupts stored Editor.js block data —
// use the column-only form so jsonb contents pass through untouched.
export const sql = (CACHE && globalThis._sql) || postgres(URL_, { transform: { column: { from: postgres.toCamel, to: postgres.fromCamel } }, max: 10 })
if (CACHE) globalThis._sql = sql

// Same database, no transform: @fedify/postgres reads raw snake_case columns
// off result rows (mq.ts does `candidate.ordering_key`), so the camel transform
// would hand it undefined and break ordered delivery. Small pool — it only
// carries the KV, the queue table and one LISTEN connection.
export const fedifySql = (CACHE && globalThis._fedifySql) || postgres(URL_, { max: 4 })
if (CACHE) globalThis._fedifySql = fedifySql

// Idempotent DDL (create ... if not exists). Multi-statement string → simple protocol.
export async function ensureSchema(): Promise<void> { await sql.unsafe(SCHEMA) }
