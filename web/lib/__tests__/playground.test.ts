import { describe, it, expect } from 'vitest'
import { buildJsonRpcRequest, buildCurlRest } from '@/lib/playground'
import { RPC_METHODS } from '@/lib/rpc-schema'
import { REST_ENDPOINTS } from '@/lib/rest-schema'

describe('buildJsonRpcRequest', () => {
  it('builds a no-param request', () => {
    const method = RPC_METHODS.find((m) => m.name === 'get_dynamic_global_properties')!
    expect(buildJsonRpcRequest(method, {})).toEqual({
      jsonrpc: '2.0', id: 1,
      method: 'get_dynamic_global_properties',
      params: undefined,
    })
  })

  it('coerces number params', () => {
    const method = RPC_METHODS.find((m) => m.name === 'get_block')!
    const result = buildJsonRpcRequest(method, { block_num: '42' }) as Record<string, unknown>
    expect((result.params as Record<string, unknown>).block_num).toBe(42)
  })

  it('coerces boolean params', () => {
    const method = RPC_METHODS.find((m) => m.name === 'get_ops_in_block')!
    const result = buildJsonRpcRequest(method, { block_num: '1', only_virtual: 'true' }) as Record<string, unknown>
    expect((result.params as Record<string, unknown>).only_virtual).toBe(true)
  })

  it('splits string[] on comma and trims whitespace', () => {
    const method = RPC_METHODS.find((m) => m.name === 'get_accounts')!
    const result = buildJsonRpcRequest(method, { account_names: 'alice, bob' }) as Record<string, unknown>
    expect((result.params as Record<string, unknown>).account_names).toEqual(['alice', 'bob'])
  })

  it('omits optional params when value is empty', () => {
    const method = RPC_METHODS.find((m) => m.name === 'get_block')!
    const result = buildJsonRpcRequest(method, { block_num: '7' }) as Record<string, unknown>
    expect(result.params).toEqual({ block_num: 7 })
  })
})

describe('buildCurlRest', () => {
  it('builds GET for endpoint with no params', () => {
    const ep = REST_ENDPOINTS.find((e) => e.path === '/blocks/latest')!
    expect(buildCurlRest(ep, {})).toBe('curl https://api.viz.cx/blocks/latest')
  })

  it('interpolates path params', () => {
    const ep = REST_ENDPOINTS.find((e) => e.path === '/blocks/{id}')!
    expect(buildCurlRest(ep, { id: '100' })).toBe('curl https://api.viz.cx/blocks/100')
  })

  it('falls back to example value when no value provided', () => {
    const ep = REST_ENDPOINTS.find((e) => e.path === '/profile/{user}')!
    expect(buildCurlRest(ep, {})).toBe('curl https://api.viz.cx/profile/alice')
  })
})
