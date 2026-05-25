export const ASSET_TYPES = [
  "checklists",
  "configurations",
  "contacts",
  "documents",
  "domain_tracker",
  "locations",
  "passwords",
  "ssl_tracker",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export type AssetCounts = Record<AssetType, number>;

export const EMPTY_ASSET_COUNTS: AssetCounts = {
  checklists: 0,
  configurations: 0,
  contacts: 0,
  documents: 0,
  domain_tracker: 0,
  locations: 0,
  passwords: 0,
  ssl_tracker: 0,
};

export interface OrgAsset {
  id: string;
  orgId: string;
  type: AssetType;
  title: string;
  createdAt: string;
}
