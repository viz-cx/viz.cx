import type { ReactNode } from "react";

/** Surface panel with hairline border — the base container. */
export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-border bg-surface ${pad ? "p-4" : ""} ${className}`}>
      {children}
    </div>
  );
}

/** Sans-serif section heading with optional right slot. */
export function SectionTitle({
  children,
  right,
  className = "",
}: {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-2 flex items-center justify-between ${className}`}>
      <h2 className="font-prose text-xs font-semibold tracking-widest text-fg-muted uppercase">
        {children}
      </h2>
      {right}
    </div>
  );
}

/** A single labeled stat. Value is mono; label is sans/muted. */
export function StatTile({
  label,
  value,
  sub,
  tone = "fg",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "fg" | "green" | "blue" | "amber";
}) {
  const toneClass = {
    fg: "text-fg",
    green: "text-acc-green",
    blue: "text-acc-blue",
    amber: "text-acc-amber",
  }[tone];
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="font-prose text-[10px] font-semibold tracking-widest text-fg-dim uppercase">
        {label}
      </span>
      <span className={`text-lg leading-tight font-medium tabular-nums ${toneClass}`}>{value}</span>
      {sub && <span className="text-[11px] text-fg-dim">{sub}</span>}
    </div>
  );
}

/** A row of stat tiles. */
export function StatStrip({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

/** Definition row used in detail panels: label left, value right (mono). */
export function DefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="font-prose text-xs text-fg-muted">{label}</span>
      <span className="min-w-0 text-right text-[13px] text-fg tabular-nums">{children}</span>
    </div>
  );
}

/** Empty/placeholder state. */
export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-fg-dim">{children}</div>;
}
