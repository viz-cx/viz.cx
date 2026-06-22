"use client";

import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. */
  cell: (row: T, index: number) => ReactNode;
  /** Sort key extractor; omit to make the column unsortable. */
  sort?: (row: T) => number | string;
  align?: "left" | "right";
  className?: string;
  /** When true, the column is hidden below the `sm` breakpoint. */
  hideOnMobile?: boolean;
}

/**
 * Dense, sortable data table — the dashboard/validators/richlist workhorse.
 * Click a sortable header to toggle asc/desc. Numbers right-aligned + tabular.
 */
export function DataTable<T>({
  columns,
  rows,
  initialSort,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  initialSort?: { key: string; dir: "asc" | "desc" };
  rowKey: (row: T, index: number) => string | number;
}) {
  const [sort, setSort] = useState(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sort!(a);
      const bv = col.sort!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, sort, columns]);

  function toggle(key: string) {
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border-strong bg-surface-2 text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 font-prose text-[10px] font-semibold tracking-widest text-fg-muted uppercase select-none ${
                  c.align === "right" ? "text-right" : "text-left"
                } ${c.sort ? "cursor-pointer hover:text-fg" : ""} ${c.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                onClick={c.sort ? () => toggle(c.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {c.align === "right" && sortCaret(sort, c.key)}
                  {c.header}
                  {c.align !== "right" && sortCaret(sort, c.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={rowKey(row, i)} className="border-b border-border last:border-0 hover:bg-surface-2">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2 align-middle ${c.align === "right" ? "text-right tabular-nums" : ""} ${
                    c.className ?? ""
                  } ${c.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  {c.cell(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sortCaret(sort: { key: string; dir: "asc" | "desc" } | null, key: string) {
  if (sort?.key !== key) return null;
  return <span className="text-acc-blue">{sort.dir === "asc" ? "▲" : "▼"}</span>;
}
