"use client";

import { useState } from "react";

/** Collapsible raw-JSON view for the long tail of op fields. */
export function RawJson({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-prose text-xs text-acc-blue hover:underline"
      >
        {open ? "▾ hide raw JSON" : "▸ show raw JSON"}
      </button>
      {open && (
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-surface-2 p-3 text-[12px] leading-relaxed text-fg-muted">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
