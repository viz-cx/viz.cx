import { Temporal } from '@js-temporal/polyfill'
import type { ActorKeyPair, Context } from '@fedify/fedify'
import { Article, Endpoints, Hashtag, Note, Person, PUBLIC_COLLECTION } from '@fedify/vocab'
import type { CommentDoc, Post, Profile } from './types'
import { escapeHtml, renderBlocks } from './render'
import { langHref } from './i18n'

// Read once at module load, like every other absolute-URL consumer here
// (OG tags, RSS, sitemap). Tests get the default.
export const SITE_URL = process.env.SITE_URL ?? 'https://viz.cx'

// These builders only need URI construction, so tests can hand in a plain
// object instead of standing up a Federation.
export type UriCtx = Pick<Context<void>, 'getActorUri' | 'getObjectUri' | 'getFollowersUri' | 'getInboxUri'>

const at = (d: Date) => Temporal.Instant.from(d.toISOString())
export const pageUrl = (path: string): URL => new URL(path, SITE_URL)
export const postPath = (p: Pick<Post, 'lang' | 'author' | 'slug'>): string =>
  langHref(p.lang, `/@${p.author}/${p.slug}`)

export function personOf(ctx: UriCtx, profile: Profile, keys: ActorKeyPair[]): Person {
  return new Person({
    id: ctx.getActorUri(profile.account),
    preferredUsername: profile.account,   // the WebFinger name: @account@viz.cx
    name: profile.account,
    summary: profile.about,
    published: at(profile.createdAt),
    url: pageUrl(`/@${profile.account}`),
    inbox: ctx.getInboxUri(profile.account),
    followers: ctx.getFollowersUri(profile.account),
    endpoints: new Endpoints({ sharedInbox: ctx.getInboxUri() }),
    publicKey: keys[0]?.cryptographicKey,            // RSA first — see keyPairsDispatcher
    assertionMethods: keys.map(k => k.multikey),
  })
}

export function articleOf(ctx: UriCtx, post: Post): Article {
  return new Article({
    id: ctx.getObjectUri(Article, { id: post.id }),
    attribution: ctx.getActorUri(post.author),
    to: PUBLIC_COLLECTION,
    cc: ctx.getFollowersUri(post.author),
    // Mastodon shows name + summary + url; Ghost/WriteFreely/Friendica render content.
    name: post.title,
    summary: post.excerpt || null,
    content: renderBlocks(post.blocks),
    mediaType: 'text/html',
    published: at(post.createdAt),
    updated: at(post.updatedAt),
    url: pageUrl(postPath(post)),
    tags: post.tags.map(tag => new Hashtag({
      name: `#${tag}`,
      href: pageUrl(langHref(post.lang, `/tag/${tag}`)),
    })),
  })
}

export function noteOf(ctx: UriCtx, c: CommentDoc, post: Post, inReplyTo: URL): Note {
  return new Note({
    id: ctx.getObjectUri(Note, { id: c.id }),
    attribution: ctx.getActorUri(c.author),
    to: PUBLIC_COLLECTION,
    cc: ctx.getFollowersUri(c.author),
    replyTarget: inReplyTo,               // Fedify's name for inReplyTo
    // Comment bodies are stored as plain text; content must be HTML.
    content: `<p>${escapeHtml(c.body).replace(/\n/g, '<br>')}</p>`,
    mediaType: 'text/html',
    published: at(c.createdAt),
    url: pageUrl(`${postPath(post)}#c-${c.id}`),
  })
}
