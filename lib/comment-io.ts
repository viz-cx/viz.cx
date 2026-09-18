const ID = /^\d{1,19}$/   // bigint identity as a decimal string; 19 digits = int8 max (9223372036854775807)
export function validateComment(input: unknown): { postId: string; body: string; parentId?: string } | null {
  if (typeof input !== 'object' || input === null) return null
  const b = input as Record<string, unknown>
  if (typeof b.postId !== 'string' || !ID.test(b.postId)) return null
  const body = typeof b.body === 'string' ? b.body.trim() : ''
  if (!body || body.length > 2000) return null
  if (b.parentId !== undefined && (typeof b.parentId !== 'string' || !ID.test(b.parentId))) return null
  return { postId: b.postId, body, ...(b.parentId ? { parentId: b.parentId as string } : {}) }
}
