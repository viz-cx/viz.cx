/**
 * Formatting primitives shared across server and client components.
 * VIZ amounts arrive as strings like "1.234 VIZ" / "1000.000000 SHARES".
 */

const VIZ_REGEN_SECONDS = 5 * 24 * 60 * 60; // energy fully recharges in 5 days

/** Parse the numeric part of a graphene asset string ("1.234 VIZ" → 1.234). */
export function assetAmount(asset: string | number | null | undefined): number {
  if (asset == null) return 0;
  if (typeof asset === "number") return asset;
  const n = parseFloat(asset);
  return Number.isFinite(n) ? n : 0;
}

/** The symbol of an asset string ("1.234 VIZ" → "VIZ"). */
export function assetSymbol(asset: string | null | undefined): string {
  if (!asset) return "";
  const parts = asset.trim().split(/\s+/);
  return parts[1] ?? "";
}

/** Group-separated number with fixed fraction digits. */
export function num(value: number, fractionDigits = 3): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Compact human number: 1_234_567 → "1.23M". */
export function compact(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: fractionDigits,
  });
}

/** Format an asset value with its symbol, e.g. "1,234.000 VIZ". */
export function formatAsset(
  asset: string | number | null | undefined,
  symbol = "VIZ",
  fractionDigits = 3,
): string {
  return `${num(assetAmount(asset), fractionDigits)} ${symbol}`;
}

/** Group-separated number with trailing zeros trimmed ("500000.000" → "500,000", "1.5" → "1.5"). */
export function numTrim(value: number, maxFractionDigits = 3): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** A min–max asset range with a single trailing symbol, e.g. "0–500,000 VIZ". */
export function formatAssetRange(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
  symbol = "VIZ",
): string {
  return `${numTrim(assetAmount(min))}–${numTrim(assetAmount(max))} ${symbol}`;
}

/**
 * SHARES → VIZ at the current vesting rate. `fund` and `shares` are the chain's
 * total_vesting_fund and total_vesting_shares (strings or numbers).
 */
export function sharesToViz(
  shares: string | number,
  fund: string | number,
  totalShares: string | number,
): number {
  const ts = assetAmount(totalShares);
  if (ts === 0) return 0;
  return (assetAmount(shares) * assetAmount(fund)) / ts;
}

/**
 * Effective SHARES = own − delegated_out + received. The figure that actually
 * weights votes/awards. (viz-dice-bot/helpers/viz.ts)
 */
export function effectiveShares(account: {
  vesting_shares?: string;
  delegated_vesting_shares?: string;
  received_vesting_shares?: string;
}): number {
  return (
    assetAmount(account.vesting_shares) -
    assetAmount(account.delegated_vesting_shares) +
    assetAmount(account.received_vesting_shares)
  );
}

/**
 * Current energy as a 0–100% figure, regenerated from `last_vote_time`.
 * VIZ stores energy in centipercent (10000 = 100%); it refills linearly over
 * five days. A visual approximation — exact downvote accounting is out of scope.
 */
export function currentEnergy(
  rawEnergy: number,
  lastVoteTime: string | undefined,
  now: number = Date.now(),
): number {
  const base = rawEnergy > 100 ? rawEnergy / 100 : rawEnergy;
  if (!lastVoteTime) return clamp(base, 0, 100);
  const last = Date.parse(`${lastVoteTime}Z`.replace(/Z+$/, "Z"));
  if (!Number.isFinite(last)) return clamp(base, 0, 100);
  const elapsed = Math.max(0, (now - last) / 1000);
  const regen = (elapsed / VIZ_REGEN_SECONDS) * 100;
  return clamp(base + regen, 0, 100);
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Relative "Xs/m/h/d ago" from an ISO timestamp (chain times are UTC). */
export function timeAgo(iso: string | undefined, now: number = Date.now()): string {
  if (!iso) return "—";
  const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  if (!Number.isFinite(t)) return "—";
  const secs = Math.round((now - t) / 1000);
  if (secs < 0) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Absolute UTC timestamp, e.g. "2026-06-20 14:32:18 UTC". */
export function formatUTC(iso: string | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

/** Truncate a hash/key for dense display: "abcd…wxyz". */
export function truncateMiddle(s: string, head = 8, tail = 6): string {
  if (!s || s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/** Strip a leading "@" from an account-name URL segment. */
export function bareAccount(name: string): string {
  return name.startsWith("@") ? name.slice(1) : name;
}
