import { isId } from './ids'
export function validateComment(input: unknown): { postId: string; body: string; parentId?: string } | null {
  if (typeof input !== 'object' || input === null) return null
  const b = input as Record<string, unknown>
  if (!isId(b.postId)) return null
  const body = typeof b.body === 'string' ? b.body.trim() : ''
  if (!body || body.length > 2000) return null
  if (b.parentId !== undefined && !isId(b.parentId)) return null
  return { postId: b.postId, body, ...(b.parentId ? { parentId: b.parentId } : {}) }
}
