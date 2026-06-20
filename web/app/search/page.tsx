import Link from "next/link";
import type { Metadata } from "next";
import { SearchBox } from "@/components/SearchBox";
import { AccountChip } from "@/components/AccountChip";
import { Card, Empty } from "@/components/ui";
import { getProfile } from "@/lib/api";
import { bareAccount } from "@/lib/format";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const candidate = bareAccount(query).toLowerCase();

  // Best-effort: does an account by this name exist?
  const accountGuess = /^[a-z][a-z0-9.-]{1,15}$/.test(candidate) ? candidate : null;
  const profile = accountGuess ? await getProfile(accountGuess) : null;

  const isNumeric = /^\d+$/.test(query);
  const isHex = /^[0-9a-fA-F]{16,}$/.test(query);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 font-prose text-sm text-fg-dim">
          {query ? <>Results for “{query}”</> : "Enter a block number, @account, or transaction id."}
        </p>
      </div>

      <div className="max-w-2xl">
        <SearchBox size="lg" autoFocus />
      </div>

      {query && (
        <div className="flex flex-col gap-3">
          {profile && (
            <Card className="flex items-center justify-between">
              <AccountChip name={profile.name} size={28} />
              <Link href={`/@${profile.name}`} className="text-sm text-acc-blue hover:underline">
                open account →
              </Link>
            </Card>
          )}
          {isNumeric && (
            <Card className="flex items-center justify-between">
              <span className="font-prose text-sm text-fg-muted">Block #{query}</span>
              <Link href={`/block/${query}`} className="text-sm text-acc-blue hover:underline">
                open block →
              </Link>
            </Card>
          )}
          {isHex && (
            <Card className="flex items-center justify-between">
              <span className="font-prose text-sm text-fg-muted">Transaction {query.slice(0, 16)}…</span>
              <Link href={`/tx/${query.toLowerCase()}`} className="text-sm text-acc-blue hover:underline">
                open tx →
              </Link>
            </Card>
          )}
          {!profile && !isNumeric && !isHex && (
            <Card pad={false}>
              <Empty>
                Nothing matched “{query}”. Block numbers are digits, accounts start with a letter, and
                transaction ids are 40-character hex strings.
              </Empty>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
