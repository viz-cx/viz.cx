import Link from "next/link";
import { SearchBox } from "./SearchBox";
import { HeadBlockTicker } from "./HeadBlockTicker";
import { WalletChip } from "./WalletChip";
import { MobileNav } from "./MobileNav";
import { NAV } from "@/lib/nav";

/** Persistent global header: logo + smart search + nav + live head-block ticker. */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="VIZ.cx home">
          <span className="h-2.5 w-2.5 rounded-full bg-acc-green pulse-dot" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">
            VIZ<span className="text-fg-dim">.cx</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBox />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 font-prose text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="shrink-0">
          <HeadBlockTicker />
        </div>
        <div className="shrink-0">
          <WalletChip />
        </div>
        <MobileNav />
      </div>

      {/* search on small screens drops below the bar */}
      <div className="border-t border-border px-4 py-2 md:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
