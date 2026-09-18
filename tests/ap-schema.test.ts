import { describe, it, expect, afterAll } from 'vitest'
import { sql, fedifySql, ensureSchema } from '../lib/db'

// Needs a real Postgres: export DATABASE_URL=postgres://postgres@localhost:5432/postgres
describe.skipIf(!process.env.DATABASE_URL)('activitypub schema', () => {
  afterAll(async () => { await sql.end(); await fedifySql.end() })

  it('creates the AP tables and the remote_object unique index, idempotently', async () => {
    await ensureSchema()
    await ensureSchema()
    const tables = (await sql<{ tablename: string }[]>`
      select tablename from pg_tables where tablename in ('ap_keys','ap_followers','ap_reactions')`)
      .map(r => r.tablename).sort()
    expect(tables).toEqual(['ap_followers', 'ap_keys', 'ap_reactions'])
    const idx = await sql`select 1 from pg_indexes where indexname = 'comments_remote_object_idx'`
    expect(idx.length).toBe(1)
  })

  it('fedifySql hands back raw snake_case column names', async () => {
    // @fedify/postgres reads `row.ordering_key` directly (mq.ts). Our app client
    // renames it to orderingKey, which would silently break ordered delivery —
    // hence the second, untransformed pool.
    const [raw] = await fedifySql<Record<string, unknown>[]>`select 1 as ordering_key`
    expect(Object.keys(raw)).toEqual(['ordering_key'])
    const [camel] = await sql<Record<string, unknown>[]>`select 1 as ordering_key`
    expect(Object.keys(camel)).toEqual(['orderingKey'])
  })
})
