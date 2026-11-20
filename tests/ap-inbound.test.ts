import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Article, Note } from '@fedify/vocab'
import type { ParseUriResult } from '@fedify/fedify'
import {
  classifyReplyTarget, handleOf, htmlToText, isBlockedActor,
  placeReply, saveRemoteComment, upsertFollower, removeFollower,
  addReaction, removeReaction, reactionCounts,
  isPublicPost, safeHttpUrl, saveFollowing, acceptFollowing, removeFollowing, listFollowing,
  isFollowedActor, saveRemotePost, updateRemotePost, deleteRemotePost, remoteFeed,
} from '../lib/ap-inbound'
import { sql, fedifySql, ensureSchema } from '../lib/db'

describe('isBlockedActor', () => {
  const env = (v: string) => { process.env.AP_BLOCKED_DOMAINS = v }
  it('passes everything when the list is empty', () => {
    env(''); expect(isBlockedActor('https://mastodon.social/users/a')).toBe(false)
  })
  it('matches the host and its subdomains', () => {
    env('bad.example, other.test')
    expect(isBlockedActor('https://bad.example/users/a')).toBe(true)
    expect(isBlockedActor('https://shard.bad.example/users/a')).toBe(true)
    expect(isBlockedActor('https://notbad.example/users/a')).toBe(false)
  })
  it('blocks unusable actor ids', () => {
    env(''); expect(isBlockedActor(null)).toBe(true); expect(isBlockedActor('not a url')).toBe(true)
  })
})

describe('handleOf', () => {
  it('builds user@host', () => expect(handleOf('alice', 'https://m.example/users/alice')).toBe('alice@m.example'))
  it('falls back to the actor id', () => expect(handleOf(null, 'https://m.example/users/alice')).toBe('https://m.example/users/alice'))
})

describe('htmlToText', () => {
  it('turns </p> and <br> into newlines and drops every tag', () => {
    expect(htmlToText('<p>one</p><p>two<br>three</p>')).toBe('one\n\ntwo\nthree')
  })
  it('strips scripts and decodes entities', () => {
    expect(htmlToText('<p>a &amp; b<script>alert(1)</script></p>')).toBe('a & b')
  })
})

describe('isPublicPost', () => {
  const pub = new URL('https://www.w3.org/ns/activitystreams#Public')
  const followers = new URL('https://m.example/users/a/followers')
  it('accepts public in to or cc', () => {
    expect(isPublicPost([pub], [followers])).toBe(true)
    expect(isPublicPost([followers], [pub])).toBe(true)
  })
  it('rejects followers-only and direct posts', () => {
    expect(isPublicPost([followers], [])).toBe(false)
    expect(isPublicPost([new URL('https://viz.cx/ap/users/babin')], [])).toBe(false)
  })
})

describe('safeHttpUrl', () => {
  it('keeps http(s)', () => expect(safeHttpUrl('https://m.example/@a/1')).toBe('https://m.example/@a/1'))
  it('refuses script and junk urls', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('not a url')).toBeNull()
    expect(safeHttpUrl(null)).toBeNull()
  })
})

describe('classifyReplyTarget', () => {
  const obj = (cls: unknown, id: string) => ({ type: 'object', class: cls, values: { id } }) as unknown as ParseUriResult
  it('our Article → post', () => expect(classifyReplyTarget(obj(Article, '42'), 'x')).toEqual({ kind: 'post', postId: '42' }))
  it('our Note → comment', () => expect(classifyReplyTarget(obj(Note, '7'), 'x')).toEqual({ kind: 'comment', id: '7' }))
  it('unknown uri → remote', () => expect(classifyReplyTarget(null, 'https://m.example/n/1')).toEqual({ kind: 'remote', objectId: 'https://m.example/n/1' }))
  it('one of our actors → nothing to reply to', () => {
    expect(classifyReplyTarget({ type: 'actor', identifier: 'babin' } as ParseUriResult, 'x')).toBeNull()
  })
})

describe.skipIf(!process.env.DATABASE_URL)('inbound writes', () => {
  let postId: string
  beforeAll(async () => {
    await ensureSchema()
    await sql`insert into profiles (account) values ('ap-test') on conflict do nothing`
    const [p] = await sql<{ id: string }[]>`
      insert into posts (author, slug, lang, title, blocks, status)
      values ('ap-test', ${'ap-' + Date.now()}, 'en', 't', ${sql.json({ blocks: [] })}, 'published') returning id`
    postId = p.id
  })
  afterAll(async () => {
    await sql`delete from ap_reactions where post_id = ${postId}`
    await sql`delete from comments where post_id = ${postId} and parent_id is not null`
    await sql`delete from comments where post_id = ${postId}`
    await sql`delete from posts where id = ${postId}`
    await sql`delete from ap_followers where account = 'ap-test'`
    await sql`delete from ap_following where account in ('ap-test', 'ap-test2')`
    await sql`delete from ap_remote_posts where actor_id = 'https://m.example/users/r'`
    await sql`delete from profiles where account in ('ap-test', 'ap-test2')`
    await sql.end(); await fedifySql.end()
  })

  it('flattens a reply-to-a-reply onto the top-level parent', async () => {
    expect(await placeReply({ kind: 'post', postId })).toEqual({ postId, parentId: null })
    await saveRemoteComment({ postId, parentId: null, handle: 'a@m.example', body: 'top',
      remoteActor: 'https://m.example/users/a', remoteObject: 'https://m.example/n/1' })
    const top = await placeReply({ kind: 'remote', objectId: 'https://m.example/n/1' })
    expect(top).toEqual({ postId, parentId: expect.any(String) })
    await saveRemoteComment({ ...top!, handle: 'b@m.example', body: 'child',
      remoteActor: 'https://m.example/users/b', remoteObject: 'https://m.example/n/2' })
    // reply to the child → still a child of the same top-level comment
    expect(await placeReply({ kind: 'remote', objectId: 'https://m.example/n/2' })).toEqual(top)
  })

  it('is idempotent on redelivery', async () => {
    const row = { postId, parentId: null, handle: 'c@m.example', body: 'dup',
      remoteActor: 'https://m.example/users/c', remoteObject: 'https://m.example/n/9' }
    await saveRemoteComment(row); await saveRemoteComment(row)
    const n = await sql`select 1 from comments where remote_object = ${row.remoteObject}`
    expect(n.length).toBe(1)
  })

  it('upserts followers and counts reactions', async () => {
    const f = { actorId: 'https://m.example/users/a', inboxId: 'https://m.example/users/a/inbox', sharedInboxId: null, handle: 'a@m.example' }
    await upsertFollower('ap-test', f)
    await upsertFollower('ap-test', { ...f, sharedInboxId: 'https://m.example/inbox' })
    const [row] = await sql<{ sharedInboxId: string | null }[]>`select shared_inbox_id from ap_followers where account = 'ap-test'`
    expect(row.sharedInboxId).toBe('https://m.example/inbox')
    await removeFollower('ap-test', f.actorId)
    expect((await sql`select 1 from ap_followers where account = 'ap-test'`).length).toBe(0)

    await addReaction(postId, 'https://m.example/users/a', 'like')
    await addReaction(postId, 'https://m.example/users/a', 'like')   // idempotent
    await addReaction(postId, 'https://m.example/users/b', 'announce')
    expect(await reactionCounts(postId)).toEqual({ likes: 1, boosts: 1 })
    await removeReaction(postId, 'https://m.example/users/a', 'like')
    expect(await reactionCounts(postId)).toEqual({ likes: 0, boosts: 1 })
  })

  it('remote follows: posts show only once accepted, and go with the last follower', async () => {
    const actorId = 'https://m.example/users/r'
    const f = { actorId, inboxId: `${actorId}/inbox`, handle: 'r@m.example' }
    const post = { objectId: 'https://m.example/n/100', actorId, title: null, body: 'hello', url: 'https://m.example/@r/100', publishedAt: new Date(Date.now() + 86_400_000) }
    await sql`insert into profiles (account) values ('ap-test2') on conflict do nothing`
    expect(await isFollowedActor(actorId)).toBe(false)
    await saveFollowing('ap-test', f); await saveFollowing('ap-test2', f)
    expect(await isFollowedActor(actorId)).toBe(true)
    await saveRemotePost(post); await saveRemotePost(post)   // redelivery
    expect(await remoteFeed('ap-test')).toEqual([])           // still pending

    await acceptFollowing('ap-test', 'https://evil.example/users/x')   // someone else's Accept
    expect((await listFollowing('ap-test'))[0].accepted).toBe(false)
    await acceptFollowing('ap-test', actorId)
    await saveFollowing('ap-test', f)                          // re-follow keeps accepted
    const [row] = await remoteFeed('ap-test')
    expect(row).toMatchObject({ objectId: post.objectId, body: 'hello', handle: 'r@m.example' })
    expect(row.publishedAt.getTime()).toBeLessThanOrEqual(Date.now() + 5_000)   // future date clamped

    await updateRemotePost(post.objectId, 'https://evil.example/users/x', null, 'hijack')
    await updateRemotePost(post.objectId, actorId, 'T', 'edited')
    expect((await remoteFeed('ap-test'))[0]).toMatchObject({ title: 'T', body: 'edited' })

    expect(await removeFollowing('ap-test', actorId)).toBe(f.inboxId)
    expect(await removeFollowing('ap-test', actorId)).toBeNull()
    expect((await sql`select 1 from ap_remote_posts where actor_id = ${actorId}`).length).toBe(1)   // ap-test2 still follows
    await removeFollowing('ap-test2', actorId)
    expect((await sql`select 1 from ap_remote_posts where actor_id = ${actorId}`).length).toBe(0)

    await saveFollowing('ap-test', f); await saveRemotePost(post)
    await deleteRemotePost(post.objectId, 'https://evil.example/users/x')
    expect((await sql`select 1 from ap_remote_posts where object_id = ${post.objectId}`).length).toBe(1)
    await deleteRemotePost(post.objectId, actorId)
    expect((await sql`select 1 from ap_remote_posts where object_id = ${post.objectId}`).length).toBe(0)
    await removeFollowing('ap-test', actorId)
  })
})
