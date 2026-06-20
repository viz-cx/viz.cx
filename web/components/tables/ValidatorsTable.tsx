"use client";

import { DataTable, type Column } from "@/components/DataTable";
import { AccountChip } from "@/components/AccountChip";
import { compact } from "@/lib/format";

export interface ValidatorRow {
  rank: number;
  name: string;
  voteWeight: number;
  version: string;
  missed: number;
  running: boolean;
  url: string;
}

const columns: Column<ValidatorRow>[] = [
  {
    key: "rank",
    header: "#",
    cell: (r) => <span className="text-fg-dim">{r.rank}</span>,
    sort: (r) => r.rank,
  },
  {
    key: "name",
    header: "Validator",
    cell: (r) => <AccountChip name={r.name} size={18} />,
    sort: (r) => r.name,
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <span className={`inline-flex items-center gap-1.5 ${r.running ? "text-acc-green" : "text-fg-dim"}`}>
        <span className={`h-2 w-2 rounded-full ${r.running ? "bg-acc-green" : "bg-fg-dim"}`} />
        {r.running ? "running" : "idle"}
      </span>
    ),
    sort: (r) => (r.running ? 1 : 0),
  },
  {
    key: "votes",
    header: "Vote weight (VIZ)",
    align: "right",
    cell: (r) => compact(r.voteWeight),
    sort: (r) => r.voteWeight,
  },
  {
    key: "missed",
    header: "Missed",
    align: "right",
    cell: (r) => <span className={r.missed > 0 ? "text-acc-amber" : ""}>{r.missed.toLocaleString("en-US")}</span>,
    sort: (r) => r.missed,
  },
  {
    key: "version",
    header: "Version",
    align: "right",
    cell: (r) => <span className="text-fg-muted">{r.version}</span>,
    sort: (r) => r.version,
  },
];

export function ValidatorsTable({ rows }: { rows: ValidatorRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.name}
      initialSort={{ key: "votes", dir: "desc" }}
    />
  );
}
