import { listPosts, publicPostFilter } from '@/lib/queries'
import { rssFor } from '@/lib/rss'

export async function GET() {
  const posts = await listPosts(publicPostFilter('en'), 1, 30)
  return new Response(rssFor('en', posts), { headers: { 'content-type': 'application/rss+xml' } })
}
