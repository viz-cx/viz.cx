import Link from "next/link";
import { AccountChip } from "./AccountChip";
import { CATEGORY_DOT, CATEGORY_TONE, decodeOp, type DecodedOp, type OpPart } from "@/lib/ops";
import { timeAgo } from "@/lib/format";

const TONE: Record<string, string> = {
  pos: "text-acc-green",
  neg: "text-acc-red",
  neutral: "text-fg",
};

/** Renders one decoded-op sentence (account chips, amounts, memo). */
export function OpSentence({ decoded, avatars = true }: { decoded: DecodedOp; avatars?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {decoded.parts.map((p: OpPart, i) => {
        if (p.kind === "account")
          return <AccountChip key={i} name={p.name} avatar={avatars} size={16} />;
        if (p.kind === "amount")
          return (
            <span key={i} className={`font-medium ${TONE[p.tone ?? "neutral"]}`}>
              {p.text}
            </span>
          );
        if (p.kind === "memo")
          return (
            <span key={i} className="truncate text-fg-dim italic" title={p.text}>
              “{p.text.length > 60 ? `${p.text.slice(0, 60)}…` : p.text}”
            </span>
          );
        return (
          <span key={i} className="text-fg-muted">
            {p.text}
          </span>
        );
      })}
    </span>
  );
}

/**
 * A full feed/history row: category dot + op label + sentence + meta link.
 * `meta` is an optional right-aligned slot (e.g. block link or timestamp).
 */
export function OpRow({
  type,
  body,
  timestamp,
  href,
  metaLabel,
  flash = false,
}: {
  type: string;
  body: Record<string, unknown>;
  timestamp?: string;
  href?: string;
  metaLabel?: string;
  flash?: boolean;
}) {
  const decoded = decodeOp(type, body);
  return (
    <div
      className={`flex items-start gap-3 border-b border-border px-3 py-2 text-[13px] leading-5 hover:bg-surface-2 ${
        flash ? "row-in" : ""
      }`}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[decoded.category]}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <span className={`mr-2 font-prose text-[11px] font-semibold tracking-wide uppercase ${CATEGORY_TONE[decoded.category]}`}>
          {decoded.label}
        </span>
        <OpSentence decoded={decoded} />
      </div>
      {(metaLabel || timestamp) && (
        <div className="shrink-0 text-right text-[11px] text-fg-dim">
          {metaLabel &&
            (href ? (
              <Link href={href} className="text-acc-blue hover:underline">
                {metaLabel}
              </Link>
            ) : (
              <span>{metaLabel}</span>
            ))}
          {timestamp && <div title={timestamp}>{timeAgo(timestamp)}</div>}
        </div>
      )}
    </div>
  );
}
