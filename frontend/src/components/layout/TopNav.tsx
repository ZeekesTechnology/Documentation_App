import { Bell, Search, Sparkles, User } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { HelpMenu } from "./HelpMenu";
import { OrgBreadcrumb } from "./OrgBreadcrumb";

const tabs = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/organizations", label: "Organizations" },
  { to: "/personal", label: "Personal" },
  { to: "/global", label: "Global" },
];

export function TopNav() {
  return (
    <header className="shrink-0 border-b border-vault-border bg-vault-panel">
      <div className="flex items-center gap-6 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded py-2 hover:opacity-90"
          title="Dashboard"
        >
          <img
            src="/logo.png"
            alt="MenschDocs"
            className="h-11 w-11 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-white">
            Mensch<span className="text-vault-logo-green">Docs</span>
          </span>
        </Link>

        <nav className="flex flex-1 gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                isActive ? "nav-tab nav-tab-active" : "nav-tab"
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 pb-1">
          <button
            type="button"
            className="rounded p-2 text-gray-400 hover:bg-vault-surface hover:text-white"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-2 text-gray-400 hover:bg-vault-surface hover:text-white"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-2 text-gray-400 hover:bg-vault-surface hover:text-white"
            title="Quick actions"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <HelpMenu />
          <div className="ml-2 flex items-center gap-2 border-l border-vault-border pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vault-surface text-xs text-gray-300">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm text-gray-300">Technician</span>
          </div>
        </div>
      </div>
      <OrgBreadcrumb />
    </header>
  );
}
