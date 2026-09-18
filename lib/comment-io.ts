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
// Delete rights: the local author of the comment, the author of the post it
// sits under, or an admin. `author` on a remote comment is just handle text, so
// it must never grant anything — remoteActor being set is the discriminator.
export const canDeleteComment = (
  account: string,
  c: { author: string; remoteActor: string | null; postAuthor: string },
  admins = process.env.ADMIN_ACCOUNTS ?? '',
): boolean =>
  (c.remoteActor === null && c.author === account) ||
  c.postAuthor === account ||
  admins.split(',').map(s => s.trim()).filter(Boolean).includes(account)
