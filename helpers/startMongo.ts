import { mongoose } from '@typegoose/typegoose'
import env from './env'

let cachedMongoose: Promise<any>|null = null

export async function startMongo() {
  if (cachedMongoose) {
    return cachedMongoose
  }
  cachedMongoose = mongoose.connect(env.MONGO)
    .then(() => console.log('Connected Successfully'))
    .catch((err) => console.error('Not Connected'))
  return cachedMongoose
}

export async function withTransaction(
  fn: (session: mongoose.ClientSession) => Promise<any>,
  existingSession?: mongoose.ClientSession
): Promise<void> {
  if (existingSession) {
    if (existingSession.inTransaction()) return fn(existingSession)
    return mongoose.connection.transaction(fn)
  }
  const session = await mongoose.startSession()
  try {
    await mongoose.connection.transaction(fn)
  } finally {
    session.endSession()
  }
}