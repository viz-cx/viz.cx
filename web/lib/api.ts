/**
 * Server-side REST access to api.viz.cx. Used by Server Components for fast,
 * SEO-indexable first paint. All functions are safe to call during SSR; the
 * `get*` variants return null on 404 so pages can render clean not-found UI.
 */
import { API_BASE } from "./config";
import type { BlockDoc, ChainInfo, Profile, Richlist } from "./types";

type FetchOpts = { revalidate?: number; noStore?: boolean };

async function rest<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  const init: RequestInit & { next?: { revalidate?: number } } = {};
  if (opts.noStore) init.cache = "no-store";
  else init.next = { revalidate: opts.revalidate ?? 10 };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    return null; // network / node down → caller decides fallback
  }
  if (res.status === 404) return null;
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Dynamic global properties + chain props. Changes every block → short TTL. */
export function getChainInfo(): Promise<ChainInfo | null> {
  return rest<ChainInfo>("/", { revalidate: 3 });
}

/** Latest indexed block (the archive tip). */
export function getLatestBlock(): Promise<BlockDoc | null> {
  return rest<BlockDoc>("/blocks/latest", { revalidate: 3 });
}

/** A block by number. Blocks are immutable → cache hard. */
export function getBlock(id: number): Promise<BlockDoc | null> {
  return rest<BlockDoc>(`/blocks/${id}`, { revalidate: 3600 });
}

/** An account profile. null when the account does not exist. */
export function getProfile(user: string): Promise<Profile | null> {
  return rest<Profile>(`/profile/${encodeURIComponent(user)}`, { revalidate: 30 });
}

/** Cached richlist snapshot (built by the API's background worker). */
export function getRichlist(): Promise<Richlist | null> {
  return rest<Richlist>("/richlist", { revalidate: 60 });
}

/** Absolute URL of an account's SVG identicon (served by the API). */
export function avatarUrl(user: string): string {
  return `${API_BASE}/profile/avatar/${encodeURIComponent(user)}`;
}
