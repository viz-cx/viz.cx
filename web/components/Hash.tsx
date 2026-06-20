import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { truncateMiddle } from "@/lib/format";

/** Monospace hash/key/id, middle-truncated, with copy and an optional link. */
export function Hash({
  value,
  href,
  head = 8,
  tail = 6,
  copy = true,
  className = "",
}: {
  value: string;
  href?: string;
  head?: number;
  tail?: number;
  copy?: boolean;
  className?: string;
}) {
  const short = truncateMiddle(value, head, tail);
  const text = href ? (
    <Link href={href} className="text-acc-blue hover:text-fg hover:underline" title={value}>
      {short}
    </Link>
  ) : (
    <span title={value} className="text-fg-muted">
      {short}
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {text}
      {copy && <CopyButton value={value} />}
    </span>
  );
}
