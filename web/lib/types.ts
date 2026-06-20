/** Shared shapes for VIZ chain data (REST + node). Loosely typed where the
 * upstream shape is open-ended (chain props, account extras). */

export type RawOp = readonly [string, Record<string, unknown>];

export interface OpRecord {
  trx_id?: string;
  trx_in_block: number;
  op_in_trx: number;
  virtual_op: number;
  timestamp: string;
  op: RawOp;
}

/** `GET /blocks/{id}` and `/blocks/latest`. */
export interface BlockDoc {
  _id: number;
  block: OpRecord[];
}

/** `GET /` — viz-js info(): dynamic global props + chain props, fields vary. */
export interface ChainInfo {
  head_block_number?: number;
  head_block_id?: string;
  time?: string;
  current_witness?: string;
  current_supply?: string;
  total_vesting_fund?: string;
  total_vesting_shares?: string;
  total_reward_fund?: string;
  total_reward_shares?: string;
  committee_fund?: string;
  current_aslot?: number;
  [k: string]: unknown;
}

/** One row of the cached richlist. */
export interface RichlistRow {
  name: string;
  liquid: number;
  own_shares: number;
  effective_shares: number;
  capital_viz: number;
  effective_viz: number;
  wallet: number;
}

/** `GET /richlist` — cached snapshot from the API's background worker. */
export interface Richlist {
  updated_at: string | null;
  count: number;
  total_accounts?: number;
  vesting_rate?: number;
  accounts: RichlistRow[];
}

/** `GET /profile/{user}` — VIZ Account (json_metadata normalized to object). */
export interface Profile {
  id: number;
  name: string;
  balance: string;
  vesting_shares: string;
  delegated_vesting_shares: string;
  received_vesting_shares: string;
  energy: number;
  last_vote_time?: string;
  created?: string;
  proxy?: string;
  witness_votes?: string[];
  witnesses_voted_for?: number;
  json_metadata: { profile?: { avatar?: string; name?: string; about?: string; [k: string]: unknown } } & Record<
    string,
    unknown
  >;
  [k: string]: unknown;
}
