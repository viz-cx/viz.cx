import { clamp } from "@/lib/format";

/**
 * Regenerating-energy gauge (0–100%). Green when full, amber mid, red when low.
 * A horizontal bar with the percentage called out — dense and scannable.
 */
export function EnergyMeter({ percent }: { percent: number }) {
  const p = clamp(percent, 0, 100);
  const color = p >= 66 ? "var(--color-acc-green)" : p >= 33 ? "var(--color-acc-amber)" : "var(--color-acc-red)";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-prose text-[10px] font-semibold tracking-widest text-fg-dim uppercase">
          Energy
        </span>
        <span className="text-sm font-medium tabular-nums" style={{ color }}>
          {p.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${p}%`, background: color }}
        />
      </div>
    </div>
  );
}
