"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { AccountChip } from "@/components/AccountChip";
import { num } from "@/lib/format";
import type { RichlistRow } from "@/lib/types";

type Metric = "wallet" | "effective_viz" | "capital_viz";

const METRICS: { key: Metric; label: string }[] = [
  { key: "wallet", label: "Wallet" },
  { key: "capital_viz", label: "Capital" },
  { key: "effective_viz", label: "Effective" },
];

export function RichlistTable({ rows }: { rows: RichlistRow[] }) {
  const [metric, setMetric] = useState<Metric>("wallet");

  const columns: Column<RichlistRow>[] = [
    {
      key: "rank",
      header: "#",
      cell: (_r, i) => <span className="text-fg-dim">{i + 1}</span>,
    },
    {
      key: "name",
      header: "Account",
      cell: (r) => <AccountChip name={r.name} size={18} />,
      sort: (r) => r.name,
    },
    {
      key: "liquid",
      header: "Liquid VIZ",
      align: "right",
      cell: (r) => num(r.liquid, 0),
      sort: (r) => r.liquid,
    },
    {
      key: "capital_viz",
      header: "Capital (VIZ)",
      align: "right",
      cell: (r) => <span className={metric === "capital_viz" ? "text-acc-green" : ""}>{num(r.capital_viz, 0)}</span>,
      sort: (r) => r.capital_viz,
    },
    {
      key: "effective_viz",
      header: "Effective (VIZ)",
      align: "right",
      cell: (r) => <span className={metric === "effective_viz" ? "text-acc-green" : ""}>{num(r.effective_viz, 0)}</span>,
      sort: (r) => r.effective_viz,
    },
    {
      key: "wallet",
      header: "Wallet (VIZ)",
      align: "right",
      cell: (r) => (
        <span className={`font-medium ${metric === "wallet" ? "text-acc-green" : "text-fg"}`}>
          {num(r.wallet, 0)}
        </span>
      ),
      sort: (r) => r.wallet,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="font-prose text-xs text-fg-dim">Rank by</span>
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-md px-2.5 py-1 font-prose text-xs ${
                metric === m.key ? "bg-surface-3 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        key={metric}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.name}
        initialSort={{ key: metric, dir: "desc" }}
      />
    </div>
  );
}
