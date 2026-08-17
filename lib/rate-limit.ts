// ponytail: in-memory per-instance sliding window — fine for one container; move to Mongo if we scale out
const hits = new Map<string, number[]>()
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  if (arr.length >= limit) { hits.set(key, arr); return false }
  arr.push(now); hits.set(key, arr); return true
}
