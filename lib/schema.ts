// Applied at boot by instrumentation.ts (ensureSchema). Every statement is
// idempotent. Mongo TTL indexes (sessions.expiresAt, nonces.createdAt) are
// replaced by delete-on-write in lib/session.ts and app/api/auth/*.
export const SCHEMA = `
create table if not exists profiles (
  account text primary key,
  about text,
  preferred_lang text check (preferred_lang in ('en','ru')),
  created_at timestamptz not null default now()
);
create table if not exists posts (
  id bigint generated always as identity primary key,
  author text not null,
  slug text not null,
  lang text not null check (lang in ('en','ru')),
  title text not null,
  blocks jsonb not null,
  tags text[] not null default '{}',
  excerpt text not null default '',
  cover_image text,
  status text not null check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (author, slug)
);
create index if not exists posts_public_idx on posts (lang, created_at desc)
  where status = 'published' and deleted_at is null;
create index if not exists posts_tags_idx on posts using gin (tags);
create table if not exists comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts(id),
  author text not null,
  parent_id bigint references comments(id),
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists comments_post_idx on comments (post_id, created_at);
create table if not exists follows (
  follower text not null,
  following text not null,
  created_at timestamptz not null default now(),
  primary key (follower, following)
);
create table if not exists sessions (
  token_hash text primary key,
  account text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create table if not exists nonces (
  nonce text primary key,
  account text not null,
  created_at timestamptz not null default now()
);
`
