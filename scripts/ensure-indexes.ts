import { db } from '../lib/db'
export async function ensureIndexes() {
  await db.collection('posts').createIndexes([
    { key: { author: 1, slug: 1 }, unique: true },
    { key: { lang: 1, status: 1, createdAt: -1 } },
    { key: { tags: 1, lang: 1, status: 1, createdAt: -1 } },
  ])
  await db.collection('comments').createIndex({ postId: 1, createdAt: 1 })
  await db.collection('follows').createIndexes([
    { key: { follower: 1, following: 1 }, unique: true }, { key: { follower: 1 } },
  ])
  await db.collection('profiles').createIndex({ account: 1 }, { unique: true })
  await db.collection('sessions').createIndexes([
    { key: { tokenHash: 1 }, unique: true }, { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ])
  await db.collection('nonces').createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 })
}
if (process.argv[1]?.endsWith('ensure-indexes.ts')) ensureIndexes().then(() => process.exit(0))
