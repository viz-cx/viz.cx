import { listPosts, publicPostFilter } from '@/lib/queries'
import { rssFor } from '@/lib/rss'

export async function GET() {
  const posts = await listPosts(publicPostFilter('ru'), 1, 30)
  return new Response(rssFor('ru', posts), { headers: { 'content-type': 'application/rss+xml' } })
}
