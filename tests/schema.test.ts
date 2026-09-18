import { describe, it, expect, afterAll } from 'vitest'
import { sql, ensureSchema } from '../lib/db'

// Needs a real Postgres: export DATABASE_URL=postgres://postgres@localhost:5432/postgres
describe.skipIf(!process.env.DATABASE_URL)('schema', () => {
  afterAll(() => sql.end())

  it('applies idempotently and keeps posts (author, slug) unique', async () => {
    await ensureSchema()
    await ensureSchema()
    const rows = await sql`select indexdef from pg_indexes where tablename = 'posts' and indexdef ilike '%unique%(author, slug)%'`
    expect(rows.length).toBe(1)
  })

  it('returns int8 ids as strings, timestamps as Date, jsonb keys untouched', async () => {
    // Editor.js block data mixes snake_case and camelCase keys; the camel
    // transform must only touch column names, never jsonb contents.
    const blocks = { blocks: [{ type: 'image', data: { with_border: true, withBackground: false } }] }
    // Pass the object directly (not JSON.stringify'd) — postgres.js infers the
    // ::jsonb cast and serializes it itself; pre-stringifying double-encodes
    // it into a jsonb *string* scalar instead of a jsonb object.
    const [{ id }] = await sql<{ id: string }[]>`
      insert into posts (author, slug, lang, title, blocks, status)
      values ('schema-test', ${'s-' + Date.now()}, 'en', 't', ${sql.json(blocks)}, 'draft') returning id`
    const [row] = await sql<{ id: string; blocks: unknown; createdAt: Date; coverImage: string | null }[]>`
      select id, blocks, created_at, cover_image from posts where id = ${id}`
    expect(typeof row.id).toBe('string')
    expect(row.blocks).toEqual(blocks)
    expect(row.createdAt).toBeInstanceOf(Date)
    expect(row.coverImage).toBeNull()
    await sql`delete from posts where id = ${id}`
  })
})
