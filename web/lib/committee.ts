/**
 * VIZ committee_api access — the on-chain DAO (committee fund) request system.
 *
 * @viz-cx/core's ReadApi exposes no committee methods and no generic call, so
 * these go over raw JSON-RPC. The node only accepts the legacy `call` envelope
 * for committee_api — the dotted-method form (`committee_api.get_…`) is rejected
 * with a bad_cast. Args are positional. See memory: committee-api-facts.
 *
 * Status enum (from chain database.cpp): 0 active (votable — create sets 0,
 * vote/cancel require 0), 1 cancelled, 2 approved, 3 extended, 4 paying out,
 * 5 completed. Old closed requests are pruned from node state after a delay,
 * so only a bounded window of recent/active requests is ever queryable.
 */
import { NODE_ENDPOINTS } from "./config";

export const STATUS_ACTIVE = 0;

/** All status values the node tracks, in lifecycle order. */
export const COMMITTEE_STATUSES = [0, 1, 2, 3, 4, 5] as const;

/** Human label per status code. */
export const STATUS_LABEL: Record<number, string> = {
  0: "Active",
  1: "Cancelled",
  2: "Approved",
  3: "Extended",
  4: "Paying out",
  5: "Completed",
};

export interface CommitteeVote {
  voter: string;
  vote_percent: number; // int16, -10000..+10000
  last_update: string;
}

export interface CommitteeRequest {
  request_id: number; // canonical id (the `id` field is an internal db index — ignore)
  url: string; // proposal document URL — no separate title field
  creator: string;
  worker: string;
  required_amount_min: string; // "X.XXX VIZ"
  required_amount_max: string; // "X.XXX VIZ"
  start_time: string; // ISO UTC
  duration: number; // seconds
  end_time: string; // ISO UTC
  status: number; // see STATUS_LABEL
  votes_count: number; // COUNT of votes cast (always >= 0), not a net tally
  votes: CommitteeVote[]; // embedded when fetched with votes_limit > 0
}

/**
 * Raw committee_api call over the legacy `call` envelope, with the same
 * node-failover spirit as core.ts's withNode (rotate on transport error).
 */
async function committeeCall(method: string, args: unknown[]): Promise<unknown> {
  let lastErr: unknown;
  for (const endpoint of NODE_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "call",
          params: ["committee_api", method, args],
        }),
      });
      const json = (await res.json()) as {
        result?: unknown;
        error?: { message?: string };
      };
      if (json.error) throw new Error(json.error.message ?? "RPC error");
      return json.result;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All VIZ nodes unreachable");
}

/** Request ids currently in the given status. Empty if none. */
export async function fetchCommitteeRequestIds(status: number): Promise<number[]> {
  const result = await committeeCall("get_committee_requests_list", [status]);
  return Array.isArray(result) ? (result as number[]) : [];
}

/**
 * Full request by id. `votesLimit` caps embedded votes (0 = none — use for list
 * rendering; a high value when the votes themselves are needed).
 */
export async function fetchCommitteeRequest(
  requestId: number,
  votesLimit = 0,
): Promise<CommitteeRequest> {
  const result = await committeeCall("get_committee_request", [requestId, votesLimit]);
  const r = result as CommitteeRequest;
  return { ...r, votes: r.votes ?? [] };
}

/** Votes for a request (re-fetches the request with a high votes limit). */
export async function fetchCommitteeVotes(requestId: number): Promise<CommitteeVote[]> {
  const r = await fetchCommitteeRequest(requestId, 100_000);
  return r.votes;
}

/** Truncates a URL to maxLen characters for collapsed row display. */
export function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + "…";
}

/** Returns "Nd left" or "Expired" based on end_time. */
export function daysLeft(endTime: string): string {
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.ceil(ms / 86_400_000);
  return `${days}d left`;
}
