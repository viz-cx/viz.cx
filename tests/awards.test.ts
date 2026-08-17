import { describe, it, expect, vi, afterEach } from 'vitest'
import { awardMemo, fetchAwardTotals } from '../lib/awards'

it('memo is language-independent canonical path', () =>
  expect(awardMemo({ author: 'alice', slug: 'moy-post' })).toBe('viz.cx/@alice/moy-post'))

const mockFetch = (body: unknown, ok = true) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => body }))

afterEach(() => vi.unstubAllGlobals())

describe('fetchAwardTotals', () => {
  it('maps total_viz (snake_case wire) to totalViz (camelCase)', async () => {
    mockFetch({ count: 3, initiators: ['bob', 'carol'], total_viz: 12.5 })
    expect(await fetchAwardTotals('viz.cx/@alice/moy-post', 'alice')).toEqual({ count: 3, totalViz: 12.5 })
  })

  it('passes through total_viz: null (the endpoint\'s current always-null state)', async () => {
    mockFetch({ count: 2, initiators: ['bob'], total_viz: null })
    expect(await fetchAwardTotals('viz.cx/@alice/moy-post', 'alice')).toEqual({ count: 2, totalViz: null })
  })

  it('returns zeros on a non-2xx response instead of throwing', async () => {
    mockFetch({}, false)
    expect(await fetchAwardTotals('memo', 'alice')).toEqual({ count: 0, totalViz: null })
  })

  it('returns zeros on a network error instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect(await fetchAwardTotals('memo', 'alice')).toEqual({ count: 0, totalViz: null })
  })

  it('returns zeros on malformed JSON shape instead of throwing', async () => {
    mockFetch({ oops: true })
    expect(await fetchAwardTotals('memo', 'alice')).toEqual({ count: 0, totalViz: null })
  })
})
