import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { fetchAssetCounts } from "../lib/api";
import { EMPTY_ASSET_COUNTS, type AssetCounts } from "../types/assets";

interface OrgAssetCountsContextValue {
  orgId: string | null;
  counts: AssetCounts;
  loading: boolean;
  refreshCounts: () => Promise<void>;
  applyCounts: (counts: AssetCounts) => void;
}

const OrgAssetCountsContext = createContext<OrgAssetCountsContextValue | null>(
  null
);

function orgIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/organizations\/([^/]+)/);
  const id = match?.[1];
  if (!id || id === "new") return null;
  return id;
}

export function OrgAssetCountsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const orgId = orgIdFromPath(location.pathname);
  const [counts, setCounts] = useState<AssetCounts>(EMPTY_ASSET_COUNTS);
  const [loading, setLoading] = useState(false);

  const refreshCounts = useCallback(async () => {
    if (!orgId) {
      setCounts(EMPTY_ASSET_COUNTS);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAssetCounts(orgId);
      setCounts(data.counts);
    } catch {
      setCounts(EMPTY_ASSET_COUNTS);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const applyCounts = useCallback((next: AssetCounts) => {
    setCounts(next);
  }, []);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  const value = useMemo(
    () => ({ orgId, counts, loading, refreshCounts, applyCounts }),
    [orgId, counts, loading, refreshCounts, applyCounts]
  );

  return (
    <OrgAssetCountsContext.Provider value={value}>
      {children}
    </OrgAssetCountsContext.Provider>
  );
}

export function useOrgAssetCounts() {
  const ctx = useContext(OrgAssetCountsContext);
  if (!ctx) {
    throw new Error("useOrgAssetCounts must be used within OrgAssetCountsProvider");
  }
  return ctx;
}
