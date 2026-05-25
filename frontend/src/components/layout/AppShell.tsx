import { Outlet } from "react-router-dom";
import { OrgAssetCountsProvider } from "../../contexts/OrgAssetCountsContext";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell() {
  return (
    <OrgAssetCountsProvider>
      <div className="flex h-full min-h-screen flex-col bg-vault-bg">
        <TopNav />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="min-h-0 flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <footer className="flex shrink-0 items-center justify-between border-t border-vault-border bg-vault-panel px-4 py-2 text-xs text-gray-500">
          <span>© MenschDocs — Internal documentation platform</span>
          <span className="text-gray-600">v1.0.0</span>
        </footer>
      </div>
    </OrgAssetCountsProvider>
  );
}
