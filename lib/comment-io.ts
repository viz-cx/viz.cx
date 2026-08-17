import { ObjectId } from 'mongodb'
export function validateComment(input: unknown): { postId: string; body: string; parentId?: string } | null {
  if (typeof input !== 'object' || input === null) return null
  const b = input as Record<string, unknown>
  if (typeof b.postId !== 'string' || !ObjectId.isValid(b.postId)) return null
  const body = typeof b.body === 'string' ? b.body.trim() : ''
  if (!body || body.length > 2000) return null
  if (b.parentId !== undefined && (typeof b.parentId !== 'string' || !ObjectId.isValid(b.parentId))) return null
  return { postId: b.postId, body, ...(b.parentId ? { parentId: b.parentId as string } : {}) }
}
