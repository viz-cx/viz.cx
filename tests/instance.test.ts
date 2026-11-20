import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql, fedifySql, ensureSchema } from '../lib/db'
import { GET } from '../app/api/v2/instance/route'

// Needs a real Postgres: export DATABASE_URL=postgres://postgres@localhost:5432/postgres
describe.skipIf(!process.env.DATABASE_URL)('GET /api/v2/instance', () => {
  beforeAll(async () => {
    await ensureSchema()
    await sql`insert into profiles (account) values ('instance-probe') on conflict do nothing`
  })
  afterAll(async () => {
    await sql`delete from profiles where account = 'instance-probe'`
    await sql.end(); await fedifySql.end()
  })

  it('serves a Mastodon v2 Instance entity', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    const body = await res.json()
    expect(body.domain).toBe('viz.cx')
    expect(body.version).toMatch(/^\d+\.\d+\.\d+ \(compatible; viz\.cx /)
    // A number, not postgres.js's count(*) string — and it sees the row above.
    expect(typeof body.usage.users.active_month).toBe('number')
    expect(body.usage.users.active_month).toBeGreaterThanOrEqual(1)
    // Fields Mastodon marks required; a peer that destructures them must not throw.
    for (const k of ['title', 'source_url', 'description', 'thumbnail', 'languages', 'configuration', 'registrations', 'contact', 'rules'])
      expect(body, k).toHaveProperty(k)
  })
})
