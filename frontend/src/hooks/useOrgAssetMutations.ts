import { useCallback } from "react";
import { useOrgAssetCounts } from "../contexts/OrgAssetCountsContext";
import { createOrgAsset, deleteOrgAsset } from "../lib/api";
import type { AssetType } from "../types/assets";

/** Add or remove core assets and keep sidebar counts in sync for the current org. */
export function useOrgAssetMutations() {
  const { orgId, applyCounts } = useOrgAssetCounts();

  const addAsset = useCallback(
    async (type: AssetType, title: string) => {
      if (!orgId) throw new Error("No organization selected");
      const result = await createOrgAsset(orgId, { type, title });
      applyCounts(result.counts);
      return result.asset;
    },
    [orgId, applyCounts]
  );

  const removeAsset = useCallback(
    async (assetId: string) => {
      if (!orgId) throw new Error("No organization selected");
      const result = await deleteOrgAsset(orgId, assetId);
      applyCounts(result.counts);
    },
    [orgId, applyCounts]
  );

  return { addAsset, removeAsset };
}
