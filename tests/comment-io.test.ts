import { describe, it, expect } from 'vitest'
import { validateComment } from '../lib/comment-io'
const id = '42'
describe('validateComment', () => {
  it('accepts trimmed body', () => expect(validateComment({ postId: id, body: '  hi  ' })?.body).toBe('hi'))
  it('accepts a numeric parentId', () => expect(validateComment({ postId: id, body: 'hi', parentId: '7' })?.parentId).toBe('7'))
  it('rejects empty / >2000 chars / bad ids', () => {
    expect(validateComment({ postId: id, body: '  ' })).toBeNull()
    expect(validateComment({ postId: id, body: 'x'.repeat(2001) })).toBeNull()
    expect(validateComment({ postId: 'nope', body: 'hi' })).toBeNull()
    expect(validateComment({ postId: '0'.repeat(24), body: 'hi' })).toBeNull() // old ObjectId shape is no longer an id
    expect(validateComment({ postId: id, body: 'hi', parentId: 'nope' })).toBeNull()
  })
  it('rejects a 19-digit id above int8 max, accepts the max itself', () => {
    expect(validateComment({ postId: '9'.repeat(19), body: 'hi' })).toBeNull()
    expect(validateComment({ postId: '9223372036854775807', body: 'hi' })?.postId).toBe('9223372036854775807')
  })
})
