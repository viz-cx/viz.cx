import { avatarUrl } from "@/lib/api";
import { bareAccount } from "@/lib/format";

/** SVG identicon from the API, square with a hairline ring. */
export function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const user = bareAccount(name);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote SVG identicon, no optimization needed
    <img
      src={avatarUrl(user)}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-sm bg-surface-2 ring-1 ring-border"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
