import Link from "next/link";
import { Avatar } from "./Avatar";
import { bareAccount } from "@/lib/format";

/** Avatar + @name, linked to the account page. Used everywhere a name appears. */
export function AccountChip({
  name,
  avatar = true,
  size = 18,
  className = "",
}: {
  name: string;
  avatar?: boolean;
  size?: number;
  className?: string;
}) {
  const user = bareAccount(name);
  return (
    <Link
      href={`/@${user}`}
      className={`inline-flex items-center gap-1.5 align-middle text-acc-blue hover:text-fg hover:underline ${className}`}
    >
      {avatar && <Avatar name={user} size={size} />}
      <span className="truncate">@{user}</span>
    </Link>
  );
}
