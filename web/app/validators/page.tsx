import type { Metadata } from "next";
import { withNode } from "@/lib/core";
import { getChainInfo } from "@/lib/api";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { ValidatorsTable, type ValidatorRow } from "@/components/tables/ValidatorsTable";
import { assetAmount, sharesToViz } from "@/lib/format";

export const revalidate = 30;
export const metadata: Metadata = { title: "Validators" };

// The on-chain "null" signing key marks a disabled (idle) validator.
const NULL_KEY = "VIZ1111111111111111111111111111111114T1Anm";

interface RawValidator {
  owner?: string;
  url?: string;
  total_votes?: string | number;
  running_version?: string;
  total_missed?: number;
  signing_key?: string;
  [k: string]: unknown;
}

export default async function ValidatorsPage() {
  let rows: ValidatorRow[] = [];
  let failed = false;

  try {
    const info = await getChainInfo();
    const fund = info?.total_vesting_fund_viz ?? "0";
    const totalShares = info?.total_vesting_shares ?? "0";

    const names = await withNode((api) => api.getActiveValidators());
    const unique = [...new Set(names.filter(Boolean))];
    const vals = (await Promise.all(
      unique.map((n) => withNode((api) => api.getValidatorByAccount(n)).catch(() => null)),
    )) as (RawValidator | null)[];

    rows = vals
      .filter((v): v is RawValidator => !!v && !!v.owner)
      .map((v) => {
        const votesShares = assetAmount(v.total_votes as string | number);
        return {
          name: v.owner!,
          voteWeight: sharesToViz(votesShares, fund, totalShares),
          version: v.running_version ?? "—",
          missed: v.total_missed ?? 0,
          running: (v.signing_key ?? NULL_KEY) !== NULL_KEY,
          url: v.url ?? "",
        };
      })
      .sort((a, b) => b.voteWeight - a.voteWeight)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  } catch {
    failed = true;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Validators</h1>
        <p className="mt-1 font-prose text-sm text-fg-dim">
          The active validator set producing blocks on VIZ (DPoS). Click a column to sort.
        </p>
      </div>

      {failed || rows.length === 0 ? (
        <Card pad={false}>
          <Empty>
            {failed
              ? "Could not reach a VIZ node to load the validator set. Try again shortly."
              : "No active validators reported."}
          </Empty>
        </Card>
      ) : (
        <>
          <SectionTitle>{rows.length} active validators</SectionTitle>
          <ValidatorsTable rows={rows} />
        </>
      )}
    </div>
  );
}
