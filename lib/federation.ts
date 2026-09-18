import { createFederation, exportJwk, generateCryptoKeyPair, importJwk } from '@fedify/fedify'
import {
  Accept, Announce, Article, Create, Delete, Follow, Like, Note, Undo, Update,
  type Recipient,
} from '@fedify/vocab'
import { PostgresKvStore, PostgresMessageQueue } from '@fedify/postgres'
import { configureSync, getConfig, getConsoleSink } from '@logtape/logtape'
import type { JSONValue } from 'postgres'
import { sql, fedifySql } from './db'
import type { CommentDoc, Post, Profile } from './types'
import { isId } from './ids'
import { SITE_URL, articleOf, noteOf, personOf, type UriCtx } from './ap-objects'
import * as inbound from './ap-inbound'

// Fedify logs through LogTape and complains on every call if nothing is
// configured. Warnings (permanently failed deliveries, signature problems) go
// to the container log; that is the whole observability story for v1.
if (getConfig() == null) {
  configureSync({
    sinks: { console: getConsoleSink() },
    loggers: [
      { category: 'fedify', sinks: ['console'], lowestLevel: 'warning' },
      { category: 'logtape', sinks: ['console'], lowestLevel: 'error' },
    ],
  })
}

export const kv = new PostgresKvStore(fedifySql)
export const queue = new PostgresMessageQueue(fedifySql)

const federation = createFederation<void>({
  kv,
  queue,
  // Kamal's proxy terminates TLS, so in-container request URLs are http:// —
  // without this every minted id would be wrong and permanently wrong.
  origin: SITE_URL,
  // Next bundles proxy.ts, route handlers and instrumentation.ts separately, so
  // each gets its own Federation object. Only instrumentation.ts starts a
  // worker; the others just enqueue. Safe because KV, queue and keys all live
  // in Postgres.
  manuallyStartQueue: true,
  // `fedify inbox`/`fedify tunnel` loopback in dev; SSRF guard stays on in prod.
  allowPrivateAddress: process.env.NODE_ENV !== 'production',
})
export default federation

const profileOf = async (account: string): Promise<Profile | null> => {
  const [p] = await sql<Profile[]>`select * from profiles where account = ${account}`
  return p ?? null
}

// RSA first: Person.publicKey (what Mastodon reads for HTTP Signatures) is
// keys[0]; Ed25519 rides along in assertionMethods for FEP-8b32.
const KEY_TYPES = ['RSASSA-PKCS1-v1_5', 'Ed25519'] as const
type KeyRow = { type: string; privateKey: JsonWebKey; publicKey: JsonWebKey }

const keyRows = (account: string) =>
  sql<KeyRow[]>`select type, private_key, public_key from ap_keys where account = ${account}`

// Minted on first actor resolution, never from a VIZ chain key. `on conflict do
// nothing` makes two concurrent first fetches converge instead of racing.
async function mintKeys(account: string): Promise<void> {
  for (const type of KEY_TYPES) {
    const pair = await generateCryptoKeyPair(type)
    await sql`insert into ap_keys (account, type, private_key, public_key) values (
      ${account}, ${type},
      ${sql.json(await exportJwk(pair.privateKey) as JSONValue)},
      ${sql.json(await exportJwk(pair.publicKey) as JSONValue)}
    ) on conflict do nothing`
  }
}

federation
  .setActorDispatcher('/ap/users/{identifier}', async (ctx, identifier) => {
    const profile = await profileOf(identifier)
    if (profile == null) return null
    return personOf(ctx, profile, await ctx.getActorKeyPairs(identifier))
  })
  .setKeyPairsDispatcher(async (_ctx, identifier) => {
    if (await profileOf(identifier) == null) return []
    let rows = await keyRows(identifier)
    if (rows.length < KEY_TYPES.length) { await mintKeys(identifier); rows = await keyRows(identifier) }
    rows.sort((a, b) => KEY_TYPES.indexOf(a.type as typeof KEY_TYPES[number]) - KEY_TYPES.indexOf(b.type as typeof KEY_TYPES[number]))
    return Promise.all(rows.map(async r => ({
      privateKey: await importJwk(r.privateKey, 'private'),
      publicKey: await importJwk(r.publicKey, 'public'),
    })))
  })

federation
  .setFollowersDispatcher('/ap/users/{identifier}/followers', async (_ctx, identifier) => {
    // Unpaginated on purpose: sendActivity("followers") calls this with
    // cursor === null and treats whatever comes back as the ENTIRE collection.
    // Returning a first page here would silently deliver to that page only.
    // ponytail: one query, no LIMIT; add setFirstCursor + keyset paging if an account passes a few thousand followers.
    const rows = await sql<{ actorId: string; inboxId: string; sharedInboxId: string | null }[]>`
      select actor_id, inbox_id, shared_inbox_id from ap_followers where account = ${identifier} order by created_at`
    const items: Recipient[] = rows.map(r => ({
      id: new URL(r.actorId),
      inboxId: new URL(r.inboxId),
      endpoints: r.sharedInboxId ? { sharedInbox: new URL(r.sharedInboxId) } : null,
    }))
    return { items }
  })

// The AP id of what a comment replies to: the remote Note when the parent came
// from the fediverse, otherwise our own Note or Article. Shared with ap-send.
export async function inReplyToUri(ctx: UriCtx, c: CommentDoc): Promise<URL> {
  if (c.parentId == null) return ctx.getObjectUri(Article, { id: c.postId })
  const [p] = await sql<{ remoteObject: string | null }[]>`select remote_object from comments where id = ${c.parentId}`
  return p?.remoteObject ? new URL(p.remoteObject) : ctx.getObjectUri(Note, { id: c.parentId })
}

federation.setObjectDispatcher(Article, '/ap/posts/{id}', async (ctx, { id }) => {
  if (!isId(id)) return null
  const [post] = await sql<Post[]>`select * from posts where id = ${id} and status = 'published' and deleted_at is null`
  return post ? articleOf(ctx, post) : null
})

federation.setObjectDispatcher(Note, '/ap/comments/{id}', async (ctx, { id }) => {
  if (!isId(id)) return null
  // remote_object is null ⇒ ours to serve; remote comments are the other
  // server's to serve.
  const [c] = await sql<CommentDoc[]>`select * from comments where id = ${id} and deleted_at is null and remote_object is null`
  if (!c) return null
  const [post] = await sql<Post[]>`select * from posts where id = ${c.postId}`
  return post ? noteOf(ctx, c, post, await inReplyToUri(ctx, c)) : null
})

// Every listener starts here. A blocked or unusable actor id is dropped before
// any write.
const allowed = (actorId: URL | null): actorId is URL => !inbound.isBlockedActor(actorId?.href)
const actId = (actor: URL, kind: string) => new URL(`#${kind}/${crypto.randomUUID()}`, actor)

federation
  .setInboxListeners('/ap/users/{identifier}/inbox', '/ap/inbox')
  // Servers in authorized-fetch mode want our shared-inbox object lookups
  // signed. Borrow the first admin account's key rather than run an instance
  // actor — one fewer actor to mint, name and moderate.
  .setSharedKeyDispatcher(() => {
    const admin = (process.env.ADMIN_ACCOUNTS ?? '').split(',')[0]?.trim()
    return admin ? { identifier: admin } : null
  })
  .on(Follow, async (ctx, follow) => {
    if (!allowed(follow.actorId) || follow.objectId == null) return
    const target = ctx.parseUri(follow.objectId)
    if (target?.type !== 'actor' || await profileOf(target.identifier) == null) return
    const actor = await follow.getActor(ctx)
    if (actor?.id == null || actor.inboxId == null) return
    await inbound.upsertFollower(target.identifier, {
      actorId: actor.id.href,
      inboxId: actor.inboxId.href,
      sharedInboxId: actor.endpoints?.sharedInbox?.href ?? null,
      handle: inbound.handleOf(actor.preferredUsername?.toString() ?? null, actor.id.href),
    })
    await ctx.sendActivity({ identifier: target.identifier }, actor, new Accept({
      id: actId(ctx.getActorUri(target.identifier), 'accept'),
      actor: follow.objectId,
      object: follow,
    }))
  })
  .on(Undo, async (ctx, undo) => {
    if (!allowed(undo.actorId)) return
    const object = await undo.getObject(ctx)
    if (object instanceof Follow) {
      if (object.objectId == null) return
      const target = ctx.parseUri(object.objectId)
      if (target?.type === 'actor') await inbound.removeFollower(target.identifier, undo.actorId.href)
      return
    }
    if (object instanceof Like || object instanceof Announce) {
      const postId = await inbound.ourPostId(object.objectId ? ctx.parseUri(object.objectId) : null)
      if (postId) await inbound.removeReaction(postId, undo.actorId.href, object instanceof Like ? 'like' : 'announce')
    }
  })
  .on(Create, async (ctx, create) => {
    if (!allowed(create.actorId)) return
    const note = await create.getObject(ctx)
    if (!(note instanceof Note) || note.id == null || note.replyTargetId == null) return
    const target = inbound.classifyReplyTarget(ctx.parseUri(note.replyTargetId), note.replyTargetId.href)
    if (target == null) return
    const placement = await inbound.placeReply(target)
    if (placement == null) return
    const actor = await create.getActor(ctx)
    await inbound.saveRemoteComment({
      ...placement,
      handle: inbound.handleOf(actor?.preferredUsername?.toString() ?? null, create.actorId.href),
      body: inbound.htmlToText(note.content?.toString() ?? ''),
      remoteActor: create.actorId.href,
      remoteObject: note.id.href,
    })
  })
  .on(Update, async (ctx, update) => {
    if (!allowed(update.actorId)) return
    const note = await update.getObject(ctx)
    if (!(note instanceof Note) || note.id == null) return
    await inbound.updateRemoteComment(note.id.href, update.actorId.href, inbound.htmlToText(note.content?.toString() ?? ''))
  })
  .on(Delete, async (ctx, del) => {
    if (!allowed(del.actorId)) return
    // Bare URI (objectId) or embedded Tombstone — the embedded case never fetches.
    const objectId = del.objectId ?? (await del.getObject(ctx))?.id
    if (objectId) await inbound.deleteRemoteComment(objectId.href, del.actorId.href)
  })
  .on(Like, async (ctx, like) => {
    if (!allowed(like.actorId) || like.objectId == null) return
    const postId = await inbound.ourPostId(ctx.parseUri(like.objectId))
    if (postId) await inbound.addReaction(postId, like.actorId.href, 'like')
  })
  .on(Announce, async (ctx, announce) => {
    if (!allowed(announce.actorId) || announce.objectId == null) return
    const postId = await inbound.ourPostId(ctx.parseUri(announce.objectId))
    if (postId) await inbound.addReaction(postId, announce.actorId.href, 'announce')
  })
// Anything else is silently ignored by Fedify — that is the intended policy.
