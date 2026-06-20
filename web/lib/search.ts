/**
 * Smart-search routing. Classifies a raw query by shape and returns the path
 * to navigate to. Ambiguous input falls through to the search results page.
 *
 *   all digits        → /block/{n}
 *   @name | name      → /@{name}   (account)
 *   long hex (40)     → /tx/{id}   (transaction id)
 *   otherwise         → /search?q=…
 */

const ACCOUNT_RE = /^[a-z][a-z0-9.-]{1,15}$/; // VIZ account-name rules
const TX_HEX_RE = /^[0-9a-fA-F]{40}$/; // graphene trx_id (ripemd160, 20 bytes)
const HEX_RE = /^[0-9a-fA-F]{16,}$/;

export type SearchTarget =
  | { kind: "block"; path: string }
  | { kind: "account"; path: string }
  | { kind: "tx"; path: string }
  | { kind: "search"; path: string };

export function routeQuery(raw: string): SearchTarget | null {
  const q = raw.trim();
  if (!q) return null;

  if (/^\d+$/.test(q)) return { kind: "block", path: `/block/${q}` };

  if (q.startsWith("@")) {
    const name = q.slice(1).toLowerCase();
    return { kind: "account", path: `/@${name}` };
  }

  if (TX_HEX_RE.test(q)) return { kind: "tx", path: `/tx/${q.toLowerCase()}` };

  const lower = q.toLowerCase();
  if (ACCOUNT_RE.test(lower)) return { kind: "account", path: `/@${lower}` };

  if (HEX_RE.test(q)) return { kind: "tx", path: `/tx/${lower}` };

  return { kind: "search", path: `/search?q=${encodeURIComponent(q)}` };
}
