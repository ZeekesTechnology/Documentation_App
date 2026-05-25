import {
  BookOpen,
  CheckSquare,
  FileText,
  Globe,
  Home,
  Key,
  MapPin,
  Server,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useOrganizationId } from "../../hooks/useOrganizationId";
import {
  formatSidebarCount,
  useSidebarAssetCounts,
} from "../../hooks/useSidebarAssetCounts";
import { organizationAssetPath, organizationHomePath } from "../../lib/organizationPaths";
import type { AssetType } from "../../types/assets";

const coreItems: {
  icon: typeof CheckSquare;
  label: string;
  asset: AssetType;
}[] = [
  { icon: CheckSquare, label: "Checklists", asset: "checklists" },
  { icon: Server, label: "Configurations", asset: "configurations" },
  { icon: Users, label: "Contacts", asset: "contacts" },
  { icon: FileText, label: "Documents", asset: "documents" },
  { icon: Globe, label: "Domain Tracker", asset: "domain_tracker" },
  { icon: MapPin, label: "Locations", asset: "locations" },
  { icon: Key, label: "Passwords", asset: "passwords" },
  { icon: BookOpen, label: "SSL Tracker", asset: "ssl_tracker" },
];

export function Sidebar() {
  const orgId = useOrganizationId();
  const counts = useSidebarAssetCounts(orgId);

  if (!orgId) {
    return null;
  }

  const homePath = organizationHomePath(orgId);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-vault-border bg-[#181818]">
      <div className="border-b border-vault-border px-3 py-2">
        <NavLink
          to={homePath}
          end
          className={({ isActive }) =>
            `flex items-center gap-2 rounded px-1 py-1 text-sm ${
              isActive
                ? "font-medium text-white"
                : "text-gray-300 hover:bg-vault-surface hover:text-white"
            }`
          }
        >
          <Home className="h-4 w-4 shrink-0" />
          <span>Home</span>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="px-3 py-1 text-xs font-semibold uppercase text-gray-500">
          Core Assets
        </p>
        <ul>
          {coreItems.map((item) => {
            const count = formatSidebarCount(item.asset, counts);

            return (
            <li key={item.label}>
              <NavLink
                to={organizationAssetPath(orgId, item.asset)}
                className={({ isActive }) =>
                  `flex w-full items-center gap-2 px-3 py-1.5 text-sm ${
                    isActive
                      ? "bg-vault-surface text-white"
                      : "text-gray-300 hover:bg-vault-surface hover:text-white"
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="flex-1 text-left">{item.label}</span>
                {count !== null && count > 0 && (
                  <span className="shrink-0 tabular-nums text-gray-400">
                    {count}
                  </span>
                )}
              </NavLink>
            </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
