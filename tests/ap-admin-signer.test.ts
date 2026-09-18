import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { sql, fedifySql, ensureSchema } from '../lib/db'
import { adminSigner } from '../lib/federation'

// Needs a real Postgres: export DATABASE_URL=postgres://postgres@localhost:5432/postgres
describe.skipIf(!process.env.DATABASE_URL)('adminSigner', () => {
  const ENV = process.env.ADMIN_ACCOUNTS
  beforeAll(async () => {
    await ensureSchema()
    await sql`insert into profiles (account) values ('signer-real') on conflict do nothing`
  })
  afterEach(() => { process.env.ADMIN_ACCOUNTS = ENV })
  afterAll(async () => {
    await sql`delete from profiles where account = 'signer-real'`
    await sql.end(); await fedifySql.end()
  })

  it('skips admins that never logged in', async () => {
    // The whole point: ADMIN_ACCOUNTS[0] may have no profiles row, and the key
    // dispatcher returns [] for it — shared-inbox fetches would go out unsigned.
    process.env.ADMIN_ACCOUNTS = 'signer-ghost, signer-real'
    expect(await adminSigner()).toEqual({ identifier: 'signer-real' })
  })

  it('returns null when no admin has a profile', async () => {
    process.env.ADMIN_ACCOUNTS = 'signer-ghost'
    expect(await adminSigner()).toBeNull()
  })

  it('returns null when ADMIN_ACCOUNTS is unset or empty', async () => {
    process.env.ADMIN_ACCOUNTS = ''
    expect(await adminSigner()).toBeNull()
  })
})
