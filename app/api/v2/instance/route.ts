import { NextResponse } from 'next/server'
import { sql } from '../../../../lib/db'

// Mastodon's server-info endpoint (https://docs.joinmastodon.org/methods/instance/#v2).
// We are not Mastodon and serve no other part of its client API — this exists
// because fediverse peers (Threads) probe it to label the server they federate
// with. The "compatible" version string is the convention non-Mastodon servers
// use so version-sniffing peers parse it.
export async function GET() {
  const [row] = await sql<{ n: string }[]>`select count(*) as n from profiles`
  return NextResponse.json(
    {
      domain: 'viz.cx',
      title: 'viz.cx',
      version: '4.2.0 (compatible; viz.cx 0.1.0)',
      source_url: 'https://github.com/viz-cx/viz.cx',
      description: 'Blog-social platform for the VIZ blockchain.',
      // ponytail: total accounts, not monthly actives — add a last-seen column if anyone cares
      usage: { users: { active_month: Number(row.n) } },
      thumbnail: { url: 'https://viz.cx/favicon.ico' },
      languages: ['en', 'ru'],
      configuration: {
        urls: {},
        accounts: { max_featured_tags: 0 },
        statuses: { max_characters: 100000, max_media_attachments: 0, characters_reserved_per_url: 23 },
        media_attachments: { supported_mime_types: [] },
        polls: { max_options: 0, max_characters_per_option: 0, min_expiration: 0, max_expiration: 0 },
        translation: { enabled: false },
      },
      // Sign-in is by VIZ key: any chain account can log in, no approval step.
      registrations: { enabled: true, approval_required: false, message: null },
      contact: { email: '', account: null },
      rules: [],
    },
    { headers: { 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } },
  )
}
