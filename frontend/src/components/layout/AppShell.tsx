import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { OrgAssetCountsProvider } from "../../contexts/OrgAssetCountsContext";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

type BuildInfo = {
  version?: string;
  bundle?: string;
};

export function AppShell() {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    void window.documentationApp?.getAppVersion().then(setAppVersion);
    void fetch("./build-info.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((info: BuildInfo | null) => setBuildInfo(info))
      .catch(() => setBuildInfo(null));
  }, []);

  const footerVersion =
    buildInfo?.version && buildInfo?.bundle
      ? `v${buildInfo.version} (${buildInfo.bundle.replace("index-", "").replace(".js", "")})`
      : appVersion
        ? `v${appVersion}`
        : "";

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
          <span className="text-gray-600">{footerVersion}</span>
        </footer>
      </div>
    </OrgAssetCountsProvider>
  );
}
