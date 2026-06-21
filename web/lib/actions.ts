import {
  account,
  createHttpTransport,
  createTxBuilder,
  DEFAULT_EXPIRATION_SEC,
  type Wif,
} from '@viz-cx/core'
import { NODE_ENDPOINTS } from './config'

function makeBuilder() {
  const transport = createHttpTransport(NODE_ENDPOINTS[0])
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

export async function sendTransfer(
  wif: Wif,
  from: string,
  to: string,
  amount: string,
  memo?: string
): Promise<void> {
  await makeBuilder()
    .transfer({ from: account(from), to: account(to), amount, memo })
    .sign(wif)
    .broadcast()
}

export async function powerUp(
  wif: Wif,
  from: string,
  to: string,
  amount: string
): Promise<void> {
  await makeBuilder()
    .transferToVesting({ from: account(from), to: account(to), amount })
    .sign(wif)
    .broadcast()
}

export async function powerDown(
  wif: Wif,
  accountName: string,
  vestingShares: string
): Promise<void> {
  await makeBuilder()
    .withdrawVesting({ account: account(accountName), vestingShares })
    .sign(wif)
    .broadcast()
}

export async function delegateShares(
  wif: Wif,
  delegator: string,
  delegatee: string,
  vestingShares: string
): Promise<void> {
  await makeBuilder()
    .delegateVestingShares({ delegator: account(delegator), delegatee: account(delegatee), vestingShares })
    .sign(wif)
    .broadcast()
}

export async function voteValidator(
  wif: Wif,
  accountName: string,
  validator: string,
  approve: boolean
): Promise<void> {
  await makeBuilder()
    .accountValidatorVote({ account: account(accountName), validator: account(validator), approve })
    .sign(wif)
    .broadcast()
}

export async function createProposal(
  wif: Wif,
  creator: string,
  worker: string,
  url: string,
  requiredAmountMin: string,
  requiredAmountMax: string,
  duration: number
): Promise<void> {
  await makeBuilder()
    .committeeWorkerCreateRequest({ creator: account(creator), worker: account(worker), url, requiredAmountMin, requiredAmountMax, duration })
    .sign(wif)
    .broadcast()
}

export async function voteProposal(
  wif: Wif,
  voter: string,
  requestId: number,
  votePercent: number
): Promise<void> {
  await makeBuilder()
    .committeeVoteRequest({ voter: account(voter), requestId, votePercent })
    .sign(wif)
    .broadcast()
}

export async function cancelProposal(
  wif: Wif,
  creator: string,
  requestId: number
): Promise<void> {
  await makeBuilder()
    .committeeWorkerCancelRequest({ creator: account(creator), requestId })
    .sign(wif)
    .broadcast()
}
