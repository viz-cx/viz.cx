import * as Sentry from '@sentry/nextjs'
import { Article, Create, Delete, Note, PUBLIC_COLLECTION, Tombstone, Update } from '@fedify/vocab'
import federation, { inReplyToUri } from './federation'
import { SITE_URL, articleOf, noteOf } from './ap-objects'
import { sql } from './db'
import type { CommentDoc, Post } from './types'

// Every export here is fire-and-forget from the caller's point of view: the DB
// write already happened and a federation hiccup must never fail the request.
const swallow = (e: unknown) => { Sentry.captureException(e) }
const ctx = () => federation.createContext(new URL(SITE_URL))
const actId = (actor: URL, kind: string) => new URL(`#${kind}/${crypto.randomUUID()}`, actor)

export async function announcePost(post: Post, kind: 'create' | 'update' | 'delete'): Promise<void> {
  try {
    const c = ctx()
    const actor = c.getActorUri(post.author)
    const objectUri = c.getObjectUri(Article, { id: post.id })
    const activity =
      kind === 'delete' ? new Delete({ id: actId(actor, 'delete'), actor, to: PUBLIC_COLLECTION, object: new Tombstone({ id: objectUri }) })
      : kind === 'update' ? new Update({ id: actId(actor, 'update'), actor, to: PUBLIC_COLLECTION, object: articleOf(c, post) })
      : new Create({ id: actId(actor, 'create'), actor, to: PUBLIC_COLLECTION, object: articleOf(c, post) })
    await c.sendActivity({ identifier: post.author }, 'followers', activity)
  } catch (e) { swallow(e) }
}

export async function announceComment(comment: CommentDoc, post: Post): Promise<void> {
  try {
    const c = ctx()
    const actor = c.getActorUri(comment.author)
    const note = noteOf(c, comment, post, await inReplyToUri(c, comment))
    const activity = new Create({ id: actId(actor, 'create'), actor, to: PUBLIC_COLLECTION, object: note })
    await c.sendActivity({ identifier: comment.author }, 'followers', activity)
    // "followers" cannot be mixed with explicit recipients, so the remote actor
    // being replied to gets its own enqueue. Without this, a Mastodon user who
    // does not follow the commenter never sees the reply.
    const replyTo = comment.parentId == null ? null : await remoteParent(comment.parentId)
    if (replyTo) {
      await c.sendActivity({ identifier: comment.author }, replyTo, activity, { preferSharedInbox: true })
    }
  } catch (e) { swallow(e) }
}

export async function announceCommentDelete(comment: CommentDoc): Promise<void> {
  try {
    const c = ctx()
    const actor = c.getActorUri(comment.author)
    await c.sendActivity({ identifier: comment.author }, 'followers', new Delete({
      id: actId(actor, 'delete'), actor, to: PUBLIC_COLLECTION,
      object: new Tombstone({ id: c.getObjectUri(Note, { id: comment.id }) }),
    }))
  } catch (e) { swallow(e) }
}

// The follower row is the only inbox we know for a remote actor without a fetch.
// ponytail: inbox from ap_followers only; add a lookupObject fallback if replies to non-followers matter.
async function remoteParent(parentId: string) {
  const [p] = await sql<{ remoteActor: string | null }[]>`select remote_actor from comments where id = ${parentId}`
  if (!p?.remoteActor) return null
  const [f] = await sql<{ inboxId: string; sharedInboxId: string | null }[]>`
    select inbox_id, shared_inbox_id from ap_followers where actor_id = ${p.remoteActor} limit 1`
  if (!f) return null
  return {
    id: new URL(p.remoteActor),
    inboxId: new URL(f.inboxId),
    endpoints: f.sharedInboxId ? { sharedInbox: new URL(f.sharedInboxId) } : null,
  }
}
