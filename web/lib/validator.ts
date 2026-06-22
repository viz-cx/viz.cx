/**
 * Validator registration/status reads and chain-properties form metadata.
 *
 * @viz-cx/core's ReadApi already exposes validator_api reads
 * (getValidatorByAccount, getActiveValidators) — unlike committee_api, no raw
 * RPC wrapper is needed here. See web/lib/core.ts's withNode for the
 * node-failover read pattern this builds on.
 */
import { withNode } from "./core";
import type { ChainProperties } from "@viz-cx/core";

/** The on-chain "null" signing key marks a disabled (idle) validator. */
export const NULL_SIGNING_KEY = "VIZ1111111111111111111111111111111114T1Anm";

export interface RawValidator {
  owner?: string;
  url?: string;
  total_votes?: string | number;
  running_version?: string;
  total_missed?: number;
  signing_key?: string;
  last_confirmed_block_num?: number;
  props?: Record<string, unknown>;
  [k: string]: unknown;
}

/** Fetches a validator record by account name, or null if not a registered validator. */
export async function fetchValidator(account: string): Promise<RawValidator | null> {
  try {
    const v = await withNode((api) => api.getValidatorByAccount(account));
    return v && typeof v === "object" && "owner" in v ? (v as RawValidator) : null;
  } catch {
    return null;
  }
}

export type PropsFieldKind = "percent" | "asset-viz" | "asset-shares" | "uint";

export interface PropsField {
  key: keyof ChainProperties;
  label: string;
  kind: PropsFieldKind;
  unit?: string;
}

export interface PropsGroup {
  name: string;
  fields: PropsField[];
}

/** All 26 chain-properties fields, grouped for the form UI. Order matches the
 * chain_properties_init/hf4/hf6/hf9/hf13 cumulative struct layout. */
export const PROPS_GROUPS: PropsGroup[] = [
  {
    name: "Account Creation",
    fields: [
      { key: "accountCreationFee", label: "Account creation fee", kind: "asset-viz" },
      { key: "createAccountDelegationRatio", label: "Create-account delegation ratio", kind: "uint" },
      { key: "createAccountDelegationTime", label: "Create-account delegation time", kind: "uint", unit: "sec" },
      { key: "minDelegation", label: "Minimum delegation", kind: "asset-viz" },
      { key: "createInviteMinBalance", label: "Minimum invite balance", kind: "asset-viz" },
    ],
  },
  {
    name: "Curation & Bandwidth",
    fields: [
      { key: "minCurationPercent", label: "Min curation percent", kind: "percent" },
      { key: "maxCurationPercent", label: "Max curation percent", kind: "percent" },
      { key: "voteAccountingMinRshares", label: "Min rshares for vote accounting", kind: "uint" },
      { key: "flagEnergyAdditionalCost", label: "Flag energy additional cost", kind: "percent" },
      { key: "bandwidthReservePercent", label: "Bandwidth reserve percent", kind: "percent" },
      { key: "bandwidthReserveBelow", label: "Bandwidth reserve threshold", kind: "asset-shares" },
      { key: "dataOperationsCostAdditionalBandwidth", label: "Data-ops additional bandwidth cost", kind: "uint" },
    ],
  },
  {
    name: "Committee & Fees",
    fields: [
      { key: "committeeRequestApproveMinPercent", label: "Committee request approve min percent", kind: "percent" },
      { key: "committeeCreateRequestFee", label: "Committee create-request fee", kind: "asset-viz" },
      { key: "createPaidSubscriptionFee", label: "Create paid-subscription fee", kind: "asset-viz" },
      { key: "accountOnSaleFee", label: "Account-on-sale fee", kind: "asset-viz" },
      { key: "subaccountOnSaleFee", label: "Subaccount-on-sale fee", kind: "asset-viz" },
      { key: "validatorDeclarationFee", label: "Validator declaration fee", kind: "asset-viz" },
    ],
  },
  {
    name: "Inflation",
    fields: [
      { key: "inflationValidatorPercent", label: "Validator inflation percent", kind: "percent" },
      { key: "inflationRatioCommitteeVsRewardFund", label: "Committee vs reward-fund inflation ratio", kind: "percent" },
      { key: "inflationRecalcPeriod", label: "Inflation recalculation period", kind: "uint", unit: "blocks" },
    ],
  },
  {
    name: "Validator Penalties & Payout",
    fields: [
      { key: "validatorMissPenaltyPercent", label: "Missed-block penalty percent", kind: "percent" },
      { key: "validatorMissPenaltyDuration", label: "Missed-block penalty duration", kind: "uint", unit: "sec" },
      { key: "withdrawIntervals", label: "Power-down intervals", kind: "uint" },
      { key: "distributionEpochLength", label: "Delegator distribution epoch length", kind: "uint", unit: "blocks" },
    ],
  },
  {
    name: "Network Limits",
    fields: [
      { key: "maximumBlockSize", label: "Maximum block size", kind: "uint", unit: "bytes" },
    ],
  },
];

/** Validates a single field's raw numeric value against its kind. Returns an error message, or null if valid. */
export function validatePropsField(field: PropsField, rawValue: number): string | null {
  if (!Number.isFinite(rawValue)) return `${field.label} must be a number`;
  if (field.kind === "percent") {
    if (rawValue < 0 || rawValue > 10000) return `${field.label} must be between 0 and 10000 (basis points)`;
  } else if (field.kind === "asset-viz" || field.kind === "asset-shares") {
    if (rawValue <= 0) return `${field.label} must be greater than 0`;
  } else {
    if (rawValue < 0) return `${field.label} must be 0 or greater`;
  }
  return null;
}

/** Validates a full ChainProperties object: per-field bounds plus cross-field rules. */
export function validateProps(props: ChainProperties): string[] {
  const errors: string[] = [];
  for (const group of PROPS_GROUPS) {
    for (const field of group.fields) {
      const raw = props[field.key];
      if (raw === undefined) continue;
      const num = field.kind === "asset-viz" || field.kind === "asset-shares"
        ? parseFloat(String(raw))
        : Number(raw);
      const err = validatePropsField(field, num);
      if (err) errors.push(err);
    }
  }
  if (
    props.minCurationPercent !== undefined &&
    props.maxCurationPercent !== undefined &&
    props.minCurationPercent > props.maxCurationPercent
  ) {
    errors.push("minCurationPercent must be less than or equal to maxCurationPercent");
  }
  return errors;
}

/** camelCase → snake_case, matching the chain's wire field names. */
function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}

/**
 * Maps a raw `props` object from validator_api (snake_case wire keys, e.g.
 * `account_creation_fee`) into a camelCase ChainProperties the form can pre-fill
 * from. Fields absent from the raw object are left unset.
 */
export function propsFromRaw(raw: Record<string, unknown>): ChainProperties {
  const out: Record<string, unknown> = {};
  for (const group of PROPS_GROUPS) {
    for (const field of group.fields) {
      const wireKey = toSnakeKey(field.key);
      if (raw[wireKey] !== undefined) out[field.key] = raw[wireKey];
    }
  }
  return out as unknown as ChainProperties;
}
