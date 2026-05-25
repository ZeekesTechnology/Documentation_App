import { Link } from "react-router-dom";
import type { Organization } from "../../types/organization";

interface OrgTileProps {
  org: Organization;
  compact?: boolean;
}

export function OrgAvatar({
  initials,
  small,
}: {
  initials: string;
  small?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-vault-surface font-semibold text-gray-200 ring-1 ring-vault-border ${
        small ? "h-8 w-8 text-xs" : "h-12 w-12 text-sm"
      }`}
    >
      {initials}
    </div>
  );
}

export function OrgTile({ org, compact }: OrgTileProps) {
  return (
    <Link
      to={`/organizations/${org.id}`}
      className={`group flex flex-col items-center rounded border border-vault-border bg-vault-panel transition hover:border-vault-green/50 hover:bg-vault-surface ${
        compact ? "w-20 shrink-0 p-2" : "p-3"
      }`}
    >
      <OrgAvatar initials={org.logoInitials} />
      <span
        className={`mt-2 line-clamp-2 text-center text-gray-300 group-hover:text-white ${
          compact ? "text-[10px] leading-tight" : "text-xs"
        }`}
      >
        {org.name}
      </span>
    </Link>
  );
}
