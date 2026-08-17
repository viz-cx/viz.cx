import { MongoClient, type Db, type Collection } from 'mongodb'
import type { Post, CommentDoc, Follow, Profile, Session, Nonce } from './types'

declare global { var _mongoClient: MongoClient | undefined }
const client = globalThis._mongoClient ?? new MongoClient(process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017')
if (process.env.NODE_ENV !== 'production') globalThis._mongoClient = client

// MONGO_DB must match the db the MONGO_URL user is authorised for (infra's
// add-app.sh names both after the app), hence a knob, not a hardcoded name.
export const db: Db = client.db(process.env.MONGO_DB ?? 'viz_platform')
export const posts = (): Collection<Post> => db.collection('posts')
export const comments = (): Collection<CommentDoc> => db.collection('comments')
export const follows = (): Collection<Follow> => db.collection('follows')
export const profiles = (): Collection<Profile> => db.collection('profiles')
export const sessions = (): Collection<Session> => db.collection('sessions')
export const nonces = (): Collection<Nonce> => db.collection('nonces')
