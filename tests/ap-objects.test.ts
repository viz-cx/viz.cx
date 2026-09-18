import { describe, it, expect } from 'vitest'
import { Article, Hashtag } from '@fedify/vocab'
import { articleOf, noteOf, postPath, type UriCtx } from '../lib/ap-objects'
import type { CommentDoc, Post } from '../lib/types'

// Only the four URI builders are used, so a plain object stands in for a real
// Fedify Context — no federation object, no network, no DB.
const ctx = {
  getActorUri: (a: string) => new URL(`https://viz.cx/ap/users/${a}`),
  getObjectUri: (cls: unknown, v: Record<string, string>) =>
    new URL(`https://viz.cx/ap/${cls === Article ? 'posts' : 'comments'}/${v.id}`),
  getFollowersUri: (a: string) => new URL(`https://viz.cx/ap/users/${a}/followers`),
  getInboxUri: (a?: string) => new URL(a ? `https://viz.cx/ap/users/${a}/inbox` : 'https://viz.cx/ap/inbox'),
} as unknown as UriCtx

const post: Post = {
  id: '42', author: 'babin', slug: 'hello', lang: 'en', title: 'Hello',
  blocks: { blocks: [{ type: 'paragraph', data: { text: 'Hi <b>there</b>' } }] },
  tags: ['viz', 'fediverse'], excerpt: 'Hi there', coverImage: null, status: 'published',
  createdAt: new Date('2026-09-18T10:00:00Z'), updatedAt: new Date('2026-09-18T11:00:00Z'), deletedAt: null,
}

async function tagNames(o: Article) {
  const out: string[] = []
  for await (const tag of o.getTags()) out.push(String((tag as Hashtag).name))
  return out
}

describe('articleOf', () => {
  it('maps title/excerpt/content and the human url', async () => {
    const a = articleOf(ctx, post)
    expect(a.id?.href).toBe('https://viz.cx/ap/posts/42')
    expect(a.attributionId?.href).toBe('https://viz.cx/ap/users/babin')
    expect(a.name).toBe('Hello')
    expect(a.summary).toBe('Hi there')
    expect(a.content).toBe('<p>Hi <b>there</b></p>')
    expect((a.url as URL).href).toBe('https://viz.cx/@babin/hello')
    expect(a.published?.toString()).toContain('2026-09-18T10:00:00')
    expect(await tagNames(a)).toEqual(['#viz', '#fediverse'])
  })
  it('puts ru posts under /ru', () => {
    expect(postPath({ ...post, lang: 'ru' })).toBe('/ru/@babin/hello')
  })
})

describe('noteOf', () => {
  const c: CommentDoc = {
    id: '7', postId: '42', author: 'alice', parentId: null, body: 'nice\npost & <script>',
    createdAt: new Date('2026-09-18T12:00:00Z'), deletedAt: null,
    remoteActor: null, remoteHandle: null, remoteObject: null,
  }
  it('escapes the body, keeps newlines, anchors the human url', () => {
    const n = noteOf(ctx, c, post, new URL('https://viz.cx/ap/posts/42'))
    expect(n.id?.href).toBe('https://viz.cx/ap/comments/7')
    expect(n.content).toBe('<p>nice<br>post &amp; &lt;script&gt;</p>')
    expect(n.replyTargetId?.href).toBe('https://viz.cx/ap/posts/42')
    expect((n.url as URL).href).toBe('https://viz.cx/@babin/hello#c-7')
  })
})
