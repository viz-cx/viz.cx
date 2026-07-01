import { describe, it, expect } from 'vitest'
import { toastReducer, TOAST_DURATION, MAX_TOASTS, type Toast } from '@/lib/toast'

const mk = (id: number, kind: Toast['kind'] = 'success'): Toast => ({ id, kind, message: `m${id}` })

describe('toastReducer', () => {
  it('appends an added toast', () => {
    const next = toastReducer([], { type: 'add', toast: mk(1) })
    expect(next).toEqual([mk(1)])
  })

  it('preserves order of multiple adds', () => {
    let s: Toast[] = []
    s = toastReducer(s, { type: 'add', toast: mk(1) })
    s = toastReducer(s, { type: 'add', toast: mk(2, 'error') })
    expect(s.map(t => t.id)).toEqual([1, 2])
    expect(s[1].kind).toBe('error')
  })

  it('evicts the oldest when exceeding MAX_TOASTS', () => {
    let s: Toast[] = []
    for (let i = 1; i <= MAX_TOASTS + 2; i++) s = toastReducer(s, { type: 'add', toast: mk(i) })
    expect(s).toHaveLength(MAX_TOASTS)
    expect(s.map(t => t.id)).toEqual([3, 4, 5, 6]) // oldest (1,2) dropped
  })

  it('removes by id', () => {
    const start = [mk(1), mk(2), mk(3)]
    expect(toastReducer(start, { type: 'remove', id: 2 }).map(t => t.id)).toEqual([1, 3])
  })

  it('remove of a missing id is a no-op', () => {
    const start = [mk(1)]
    expect(toastReducer(start, { type: 'remove', id: 99 })).toEqual(start)
  })

  it('exposes the agreed durations', () => {
    expect(TOAST_DURATION.success).toBe(4000)
    expect(TOAST_DURATION.error).toBe(7000)
  })
})
