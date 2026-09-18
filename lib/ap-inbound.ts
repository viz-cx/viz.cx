import sanitizeHtml from 'sanitize-html'
import type { ParseUriResult } from '@fedify/fedify'
import { Article, Note } from '@fedify/vocab'
import { sql } from './db'
import { isId } from './ids'

// --- pure -------------------------------------------------------------------

// Read per call, not at module load: the value is deploy-time config and tests
// flip it between cases.
export function isBlockedActor(actorId: string | null | undefined): boolean {
  if (!actorId) return true
  let host: string
  try { host = new URL(actorId).hostname.toLowerCase() } catch { return true }
  const blocked = (process.env.AP_BLOCKED_DOMAINS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return blocked.some(b => host === b || host.endsWith(`.${b}`))
}

export function handleOf(preferredUsername: string | null, actorId: string): string {
  try {
    const host = new URL(actorId).hostname
    return preferredUsername ? `${preferredUsername}@${host}` : actorId
  } catch { return actorId }
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }
// Remote content is HTML; viz.cx comments are plain text. Nothing remote is
// rendered as markup, so every tag goes — but paragraph/line breaks are the
// only structure worth keeping.
// ponytail: decodes the five common named entities only; swap in `he` if a real post shows mojibake.
export function htmlToText(html: string): string {
  const withBreaks = html.replace(/<\/p\s*>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n')
  const text = sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
  return text.replace(/&[a-z#0-9]+;/gi, e => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000)
}

export type ReplyTarget =
  | { kind: 'post'; postId: string }
  | { kind: 'comment'; id: string }
  | { kind: 'remote'; objectId: string }

// `parsed` is ctx.parseUri(inReplyTo). null means the URI is not ours, i.e. the
// remote is replying to something on its own (or a third) server.
export function classifyReplyTarget(parsed: ParseUriResult | null, url: string): ReplyTarget | null {
  if (parsed == null) return { kind: 'remote', objectId: url }
  if (parsed.type !== 'object') return null
  const id = parsed.values.id
  if (!id) return null
  if (parsed.class === Article) return { kind: 'post', postId: id }
  if (parsed.class === Note) return { kind: 'comment', id }
  return null
}

// --- writes -----------------------------------------------------------------

type ParentRow = { id: string; postId: string; parentId: string | null }

// One level of nesting, the same rule POST /api/comments enforces: a reply to a
// child becomes a sibling of that child.
export async function placeReply(target: ReplyTarget): Promise<{ postId: string; parentId: string | null } | null> {
  if (target.kind === 'post') {
    if (!isId(target.postId)) return null
    const [p] = await sql<{ id: string }[]>`
      select id from posts where id = ${target.postId} and status = 'published' and deleted_at is null`
    return p ? { postId: p.id, parentId: null } : null
  }
  let parent: ParentRow | undefined
  if (target.kind === 'comment') {
    if (!isId(target.id)) return null
    ;[parent] = await sql<ParentRow[]>`select id, post_id, parent_id from comments where id = ${target.id} and deleted_at is null`
  } else {
    ;[parent] = await sql<ParentRow[]>`select id, post_id, parent_id from comments where remote_object = ${target.objectId} and deleted_at is null`
  }
  return parent ? { postId: parent.postId, parentId: parent.parentId ?? parent.id } : null
}

// remote_object is uniquely indexed, so a remote retry after our 500 is a no-op.
export const saveRemoteComment = (r: {
  postId: string; parentId: string | null; handle: string; body: string
  remoteActor: string; remoteObject: string
}) => sql`
  insert into comments (post_id, parent_id, author, body, remote_actor, remote_handle, remote_object)
  values (${r.postId}, ${r.parentId}, ${r.handle}, ${r.body}, ${r.remoteActor}, ${r.handle}, ${r.remoteObject})
  on conflict (remote_object) do nothing`

// remote_actor in the WHERE is the authorization check: only the author edits.
export const updateRemoteComment = (remoteObject: string, remoteActor: string, body: string) =>
  sql`update comments set body = ${body} where remote_object = ${remoteObject} and remote_actor = ${remoteActor}`

export const deleteRemoteComment = (remoteObject: string, remoteActor: string) =>
  sql`update comments set deleted_at = now() where remote_object = ${remoteObject} and remote_actor = ${remoteActor}`

export const upsertFollower = (account: string, f: { actorId: string; inboxId: string; sharedInboxId: string | null; handle: string }) =>
  sql`insert into ap_followers (account, actor_id, inbox_id, shared_inbox_id, handle)
      values (${account}, ${f.actorId}, ${f.inboxId}, ${f.sharedInboxId}, ${f.handle})
      on conflict (account, actor_id) do update set
        inbox_id = excluded.inbox_id, shared_inbox_id = excluded.shared_inbox_id, handle = excluded.handle`

export const removeFollower = (account: string, actorId: string) =>
  sql`delete from ap_followers where account = ${account} and actor_id = ${actorId}`

export const addReaction = (postId: string, actorId: string, type: 'like' | 'announce') =>
  sql`insert into ap_reactions (post_id, actor_id, type) values (${postId}, ${actorId}, ${type}) on conflict do nothing`

export const removeReaction = (postId: string, actorId: string, type: 'like' | 'announce') =>
  sql`delete from ap_reactions where post_id = ${postId} and actor_id = ${actorId} and type = ${type}`

export async function reactionCounts(postId: string): Promise<{ likes: number; boosts: number }> {
  const rows = await sql<{ type: 'like' | 'announce'; n: string }[]>`
    select type, count(*) as n from ap_reactions where post_id = ${postId} group by type`
  const n = (t: string) => Number(rows.find(r => r.type === t)?.n ?? 0)
  return { likes: n('like'), boosts: n('announce') }
}

// Like/Announce targets: only count them when they point at a live post of ours.
export async function ourPostId(parsed: ParseUriResult | null): Promise<string | null> {
  if (parsed == null) return null
  const t = classifyReplyTarget(parsed, '')
  if (t?.kind !== 'post' || !isId(t.postId)) return null
  const [p] = await sql<{ id: string }[]>`
    select id from posts where id = ${t.postId} and status = 'published' and deleted_at is null`
  return p?.id ?? null
}
