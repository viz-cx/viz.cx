import * as Sentry from '@sentry/nextjs'
import { Article, Create, Delete, Follow, Note, PUBLIC_COLLECTION, Tombstone, Undo, Update, isActor } from '@fedify/vocab'
import federation, { inReplyToUri } from './federation'
import { SITE_URL, articleOf, noteOf } from './ap-objects'
import { sql } from './db'
import { handleOf, isBlockedActor, removeFollowing, saveFollowing } from './ap-inbound'
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

// Unlike the announce* helpers this one reports back: the user typed a handle
// and needs to know whether it resolved. Lookups are signed with the follower's
// own key because authorized-fetch servers (Threads among them) 404 anonymous
// actor fetches.
export async function followRemote(account: string, handle: string): Promise<'ok' | 'not-found' | 'blocked'> {
  const c = ctx()
  const actor = await c.lookupObject(handle, { documentLoader: await c.getDocumentLoader({ identifier: account }) })
  if (!isActor(actor) || actor.id == null || actor.inboxId == null) return 'not-found'
  // Our own actors are followed through /api/follows, not over the wire.
  if (isBlockedActor(actor.id.href) || c.parseUri(actor.id) != null) return 'blocked'
  await saveFollowing(account, {
    actorId: actor.id.href,
    inboxId: actor.inboxId.href,
    handle: handleOf(actor.preferredUsername?.toString() ?? null, actor.id.href),
  })
  const me = c.getActorUri(account)
  await c.sendActivity({ identifier: account }, actor, new Follow({ id: actId(me, 'follow'), actor: me, object: actor.id }))
  return 'ok'
}

// The row goes first: if the Undo never arrives the remote keeps delivering,
// and the inbox drops posts from actors nobody here follows.
export async function unfollowRemote(account: string, actorId: string): Promise<void> {
  const inboxId = await removeFollowing(account, actorId)
  if (inboxId == null) return
  try {
    const c = ctx()
    const me = c.getActorUri(account)
    const object = new URL(actorId)
    await c.sendActivity({ identifier: account }, { id: object, inboxId: new URL(inboxId) }, new Undo({
      id: actId(me, 'undo'), actor: me,
      object: new Follow({ id: actId(me, 'follow'), actor: me, object }),
    }))
  } catch (e) { swallow(e) }
}
