import { MongoClient, type Db, type Collection } from 'mongodb'
import type { Post, CommentDoc, Follow, Profile, Session, Nonce } from './types'

declare global { var _mongoClient: MongoClient | undefined }
const client = globalThis._mongoClient ?? new MongoClient(process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017')
if (process.env.NODE_ENV !== 'production') globalThis._mongoClient = client

export const db: Db = client.db('viz_platform')
export const posts = (): Collection<Post> => db.collection('posts')
export const comments = (): Collection<CommentDoc> => db.collection('comments')
export const follows = (): Collection<Follow> => db.collection('follows')
export const profiles = (): Collection<Profile> => db.collection('profiles')
export const sessions = (): Collection<Session> => db.collection('sessions')
export const nonces = (): Collection<Nonce> => db.collection('nonces')
