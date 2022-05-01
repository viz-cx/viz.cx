import { mongoose } from '@typegoose/typegoose'
import { connect } from 'mongoose'
import env from './env'

export async function startMongo() {
  return connect(env.MONGO)
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