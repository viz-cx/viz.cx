"use client";

import { useEffect, useRef, useState } from "react";
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
 * Live op feed over wss://…/ws/ops. Auto-reconnects with capped backoff,
 * pauses buffering on hover, and degrades gracefully when the socket drops.
 */
export function LiveFeed() {
  const [ops, setOps] = useState<FeedOp[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "down">("connecting");
  const pausedRef = useRef(false);
  const bufferRef = useRef<FeedOp[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let backoff = 1000;
    let flushTimer: ReturnType<typeof setInterval>;

    function connect() {
      setStatus("connecting");
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        scheduleReconnect();
        return;
      }
      ws.onopen = () => {
        backoff = 1000;
        setStatus("live");
      };
      ws.onmessage = (ev) => {
        try {
          const op = JSON.parse(ev.data) as FeedOp;
          if (!op.op_type) return;
          bufferRef.current.unshift(op);
          if (bufferRef.current.length > MAX_ROWS) bufferRef.current.length = MAX_ROWS;
        } catch {
          /* ignore malformed frame */
        }
      };
      ws.onclose = () => {
        if (!closed) scheduleReconnect();
      };
      ws.onerror = () => ws?.close();
    }

    function scheduleReconnect() {
      setStatus("down");
      backoff = Math.min(backoff * 2, 15000);
      setTimeout(() => !closed && connect(), backoff);
    }

    // Flush the buffer into state on an interval so we don't re-render per frame.
    flushTimer = setInterval(() => {
      if (pausedRef.current || bufferRef.current.length === 0) return;
      setOps((prev) => [...bufferRef.current, ...prev].slice(0, MAX_ROWS));
      bufferRef.current = [];
    }, 400);

    connect();
    return () => {
      closed = true;
      clearInterval(flushTimer);
      ws?.close();
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
            Waiting for the next block…
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
