import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useOrgAssetCounts } from "../contexts/OrgAssetCountsContext";
import { countAllDocumentItems } from "../lib/documentFolders";
import { countAllPasswordEntries } from "../lib/passwordItems";
import { EMPTY_ASSET_COUNTS, type AssetCounts, type AssetType } from "../types/assets";

export function useSidebarAssetCounts(orgId: string | null): AssetCounts {
  const { counts: backendCounts } = useOrgAssetCounts();
  const location = useLocation();
  const [storageRevision, setStorageRevision] = useState(0);

  useEffect(() => {
    if (!orgId) return;

    const handleStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ orgId: string }>).detail;
      if (detail?.orgId === orgId) {
        setStorageRevision((revision) => revision + 1);
      }
    };

    window.addEventListener(
      "menschdocs-asset-storage-changed",
      handleStorageChange
    );
    return () => {
      window.removeEventListener(
        "menschdocs-asset-storage-changed",
        handleStorageChange
      );
    };
  }, [orgId]);

  useEffect(() => {
    setStorageRevision((revision) => revision + 1);
  }, [location.pathname]);

  return useMemo(() => {
    if (!orgId) return EMPTY_ASSET_COUNTS;

    return {
      ...backendCounts,
      documents: countAllDocumentItems(orgId),
      passwords: countAllPasswordEntries(orgId),
    };
  }, [orgId, backendCounts, storageRevision]);
}

export function formatSidebarCount(
  asset: AssetType,
  counts: AssetCounts
): number | null {
  const count = counts[asset];
  if (asset === "checklists" && count === 0) {
    return null;
  }
  return count;
}
