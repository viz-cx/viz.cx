import { describe, it, expect } from 'vitest'
import { validateComment } from '../lib/comment-io'
const id = '0'.repeat(24)
describe('validateComment', () => {
  it('accepts trimmed body', () => expect(validateComment({ postId: id, body: '  hi  ' })?.body).toBe('hi'))
  it('rejects empty / >2000 chars / bad ids', () => {
    expect(validateComment({ postId: id, body: '  ' })).toBeNull()
    expect(validateComment({ postId: id, body: 'x'.repeat(2001) })).toBeNull()
    expect(validateComment({ postId: 'nope', body: 'hi' })).toBeNull()
    expect(validateComment({ postId: id, body: 'hi', parentId: 'nope' })).toBeNull()
  })
})
