import { describe, it, expect } from 'vitest'
import { RPC_METHODS } from '@/lib/rpc-schema'

describe('RPC_METHODS', () => {
  it('is a non-empty array', () => {
    expect(RPC_METHODS.length).toBeGreaterThan(0)
  })

  it('all methods have required fields', () => {
    for (const m of RPC_METHODS) {
      expect(m.name, `method.name missing`).toBeTruthy()
      expect(typeof m.description).toBe('string')
      expect(Array.isArray(m.params)).toBe(true)
      expect(typeof m.resultShape).toBe('string')
    }
  })

  it('all method names are unique', () => {
    const names = RPC_METHODS.map((m) => m.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('all params have valid types', () => {
    const VALID = new Set(['string', 'number', 'boolean', 'string[]'])
    for (const m of RPC_METHODS) {
      for (const p of m.params) {
        expect(VALID.has(p.type), `${m.name}.${p.name}: invalid type "${p.type}"`).toBe(true)
      }
    }
  })

  it('includes the key documented methods', () => {
    const names = new Set(RPC_METHODS.map((m) => m.name))
    const required = [
      'get_block', 'get_accounts', 'get_dynamic_global_properties',
      'get_account_history', 'get_ops_in_block',
    ]
    for (const r of required) {
      expect(names.has(r), `missing required method: ${r}`).toBe(true)
    }
  })
})
