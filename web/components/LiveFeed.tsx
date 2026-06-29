"use client";

import { useEffect, useRef, useState } from "react";
import { createApiClient } from "@viz-cx/api";
import { OpRow } from "./OpRow";
import { WS_URL } from "@/lib/config";

interface FeedOp {
  op_id?: string;
  timestamp?: string;
  op_type: string;
  body: Record<string, unknown>;
}

const MAX_ROWS = 50;

/**
 * Live op feed over wss://…/ws/ops. Auto-reconnects with capped backoff via
 * the @viz-cx/api streamOps helper, pauses buffering on hover, and degrades
 * gracefully when the socket drops.
 */
export function LiveFeed() {
  const [ops, setOps] = useState<FeedOp[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "down">("connecting");
  const pausedRef = useRef(false);
  const bufferRef = useRef<FeedOp[]>([]);

  useEffect(() => {
    const client = createApiClient({ wsUrl: WS_URL });
    const stream = client.streamOps();

    const offStatus = stream.onStatus((s) => {
      if (s === "open") setStatus("live");
      else if (s === "reconnecting") setStatus("down");
      // 'closed' = explicit close() — ignore
    });

    const offMsg = stream.on((msg) => {
      if (!msg.opType) return;
      bufferRef.current.unshift({
        op_id: msg.opId ?? undefined,
        timestamp: msg.timestamp ?? undefined,
        op_type: msg.opType,
        body: msg.body,
      });
      if (bufferRef.current.length > MAX_ROWS) bufferRef.current.length = MAX_ROWS;
    });

    // Flush the buffer into state on an interval so we don't re-render per frame.
    // Snapshot and clear the buffer *before* scheduling setOps: React 18 batches
    // setState from intervals, so the functional updater runs after this callback
    // returns — reading bufferRef.current inside it would see the already-cleared
    // array and drop every frame.
    const flushTimer = setInterval(() => {
      if (pausedRef.current || bufferRef.current.length === 0) return;
      const batch = bufferRef.current;
      bufferRef.current = [];
      setOps((prev) => [...batch, ...prev].slice(0, MAX_ROWS));
    }, 400);

    return () => {
      offStatus();
      offMsg();
      clearInterval(flushTimer);
      stream.close();
    };
  }, []);

  return (
    <div
      className="flex flex-col"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div className="flex items-center justify-between border-b border-border-strong bg-surface-2 px-3 py-2">
        <span className="font-prose text-[11px] font-semibold tracking-widest text-fg-muted uppercase">
          Live activity
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-dim">
          <span
            className={`h-2 w-2 rounded-full ${
              status === "live" ? "bg-acc-green pulse-dot" : status === "down" ? "bg-acc-red" : "bg-acc-amber"
            }`}
          />
          {status === "live" ? "streaming" : status === "down" ? "reconnecting" : "connecting"}
          <span className="ml-1 text-fg-dim/70">· hover to pause</span>
        </span>
      </div>
      <div className="max-h-[640px] min-h-[320px] overflow-y-auto">
        {ops.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-fg-dim">
            {status === "down"
              ? "Reconnecting to the live stream…"
              : "Quiet on-chain — waiting for the next transaction…"}
          </div>
        ) : (
          ops.map((op, i) => (
            <OpRow
              key={op.op_id ?? `${op.timestamp}-${i}`}
              type={op.op_type}
              body={op.body ?? {}}
              timestamp={op.timestamp}
              flash={i === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
