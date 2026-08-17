/** Award memo format (language-independent): the canonical post path with no
 * `lang` segment, so an award to the same post from any locale link counts
 * toward the same total. */
export function awardMemo(post: { author: string; slug: string }): string {
  return `viz.cx/@${post.author}/${post.slug}`
}

interface AwardsApiResponse {
  count: number
  initiators: string[]
  total_viz: number | null
}

/** Server-side fetch of a post's award totals. The awards API is currently
 * always `total_viz: null` (no live path captures the VIZ payout amount yet,
 * per Task 11a) — that's indistinguishable from our own failure fallback,
 * which is intentional: a broken/unreachable award API must never crash the
 * post page, only show a zero. */
export async function fetchAwardTotals(memo: string, receiver: string): Promise<{ count: number; totalViz: number | null }> {
  try {
    const base = process.env.API_BASE ?? 'https://api.viz.cx'
    const url = `${base}/awards?receiver=${encodeURIComponent(receiver)}&memo=${encodeURIComponent(memo)}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return { count: 0, totalViz: null }
    const j = await res.json() as Partial<AwardsApiResponse>
    if (typeof j.count !== 'number') return { count: 0, totalViz: null }
    return { count: j.count, totalViz: typeof j.total_viz === 'number' ? j.total_viz : null }
  } catch {
    return { count: 0, totalViz: null }
  }
}
