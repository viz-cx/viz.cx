"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { routeQuery } from "@/lib/search";

/**
 * Smart search. Routes by pattern (digits→block, @name/name→account,
 * hex→tx, else→results). Press "/" anywhere to focus.
 */
export function SearchBox({ size = "md", autoFocus = false }: { size?: "md" | "lg"; autoFocus?: boolean }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const target = routeQuery(value);
    if (target) router.push(target.path);
  }

  const big = size === "lg";
  return (
    <form onSubmit={submit} className="relative w-full" role="search">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-dim">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        placeholder="Search block #, @account, or tx id…"
        className={`w-full rounded-md border border-border bg-surface-2 pr-10 pl-9 text-fg placeholder:text-fg-dim focus:border-acc-blue focus:ring-1 focus:ring-acc-blue focus:outline-none ${
          big ? "h-12 text-base" : "h-9 text-sm"
        }`}
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 font-prose text-[10px] text-fg-dim">
        /
      </kbd>
    </form>
  );
}
