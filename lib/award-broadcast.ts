'use client'
import {
  account,
  createHttpTransport,
  createTxBuilder,
  DEFAULT_EXPIRATION_SEC,
  type SignedTransaction,
  type Transport,
  type TransactionResult,
  type Wif,
} from '@viz-cx/core'
import { BroadcastUnconfirmedError, CONFIRM_TIMEOUT_MS, watchForOp } from './broadcast-confirm'

// The VIZ node's broadcast_transaction_synchronous hangs indefinitely for
// non-expired transactions on this node setup (see memory: viz-broadcast-bug).
// Use the async variant instead — and because that variant only confirms the
// *call* was accepted, not that the tx validated, wait for the op to actually
// appear on the live stream before reporting success. See broadcast-confirm.ts.
//
// Ported from network.viz.cx/web/lib/actions.ts (Task 11a), award-only.
function makeBroadcastTransport(inner: Transport): Transport {
  return {
    call: inner.call.bind(inner),
    async broadcast(signed: SignedTransaction): Promise<TransactionResult> {
      const wire = {
        ref_block_num: signed.refBlockNum,
        ref_block_prefix: signed.refBlockPrefix,
        expiration: signed.expiration,
        operations: signed.operations,
        extensions: signed.extensions,
        signatures: signed.signatures,
      }
      // Every action here builds a single-op tx, so the first op identifies it.
      const first = signed.operations[0]
      const watcher = first ? watchForOp(first[0], first[1]) : null
      try {
        const listening = watcher ? await watcher.opened : false
        await inner.call('network_broadcast_api.broadcast_transaction', [wire])
        // No live stream to confirm against: fall back to the old unverified
        // behaviour rather than failing a tx that most likely went through.
        if (!watcher || !listening) return { id: '', blockNum: 0, expiration: signed.expiration }

        const outcome = await watcher.waitForMatch(CONFIRM_TIMEOUT_MS)
        if (outcome.status !== 'confirmed') throw new BroadcastUnconfirmedError()
        return { id: '', blockNum: outcome.blockNum, expiration: signed.expiration }
      } finally {
        watcher?.stop()
      }
    },
  }
}

function makeBuilder() {
  const endpoint = process.env.NEXT_PUBLIC_VIZ_RPC_HTTP ?? 'https://rpc.viz.cx'
  const transport = makeBroadcastTransport(createHttpTransport(endpoint))
  return createTxBuilder({ transport, expirationSec: DEFAULT_EXPIRATION_SEC })
}

export async function awardAccount(
  wif: Wif,
  initiator: string,
  receiver: string,
  energyPct: number,
  memo?: string
): Promise<void> {
  await makeBuilder()
    .award({ initiator: account(initiator), receiver: account(receiver), energy: energyPct * 100, memo })
    .sign(wif)
    .broadcast()
}
