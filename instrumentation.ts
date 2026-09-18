// Next.js instrumentation hook. register() runs once per server runtime at
// startup and loads the matching Sentry config; onRequestError forwards
// server-side render/route errors to Sentry (no-op without a DSN).
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
    // Schema on boot — the standalone image has no shell entrypoint to run
    // scripts/ from. Idempotent; fails closed so a deploy that can't reach
    // Postgres never passes its healthcheck.
    await (await import('./lib/db')).ensureSchema()
    // Fedify's own tables, then the single worker that drains outbound
    // deliveries and inbox processing. createFederation(manuallyStartQueue)
    // means nothing moves until this runs. startQueue() never resolves — do not
    // await it, or register() blocks forever and the container never serves.
    const { default: federation, kv, queue } = await import('./lib/federation')
    await kv.initialize()
    await queue.initialize()
    void federation.startQueue().catch((e: unknown) => { Sentry.captureException(e) })
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
