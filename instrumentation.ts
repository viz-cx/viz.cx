// Next.js instrumentation hook. register() runs once per server runtime at
// startup and loads the matching Sentry config; onRequestError forwards
// server-side render/route errors to Sentry (no-op without a DSN).
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
    // Indexes on boot, like the API's lifespan does — the standalone Docker
    // image has no shell entrypoint to run scripts/ from, and the unique/TTL
    // indexes are load-bearing (nonces, follows, sessions). Idempotent; fails
    // closed so a deploy that can't reach mongo never passes its healthcheck.
    await (await import('./scripts/ensure-indexes')).ensureIndexes()
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
