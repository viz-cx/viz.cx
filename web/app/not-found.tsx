import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <span className="font-prose text-6xl font-semibold text-fg-dim">404</span>
      <p className="font-prose text-sm text-fg-muted">
        That block, account, or transaction couldn’t be found on VIZ.
      </p>
      <div className="w-full max-w-xl">
        <SearchBox size="lg" />
      </div>
    </div>
  );
}
