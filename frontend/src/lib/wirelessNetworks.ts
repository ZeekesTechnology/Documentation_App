import {
  ensureOrgStorageLoaded,
  getOrgStorageJson,
  ORG_STORAGE_KEYS,
  setOrgStorageJson,
} from "./orgStorage";

export type WirelessNetwork = {
  id: string;
  description: string;
  physicalLocation: string;
  ssid: string;
  encryptionType: string;
  preSharedKey: string;
  accessPoints: string;
  managementIp: string;
  managementUsername: string;
  managementPassword: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WirelessNetworkInput = Omit<
  WirelessNetwork,
  "id" | "createdAt" | "updatedAt" | "archived"
>;

function normalizeNetwork(raw: Partial<WirelessNetwork>): WirelessNetwork | null {
  if (!raw.id) return null;
  return {
    id: raw.id,
    description: raw.description ?? "",
    physicalLocation: raw.physicalLocation ?? "",
    ssid: raw.ssid ?? "",
    encryptionType: raw.encryptionType ?? "",
    preSharedKey: raw.preSharedKey ?? "",
    accessPoints: raw.accessPoints ?? "",
    managementIp: raw.managementIp ?? "",
    managementUsername: raw.managementUsername ?? "",
    managementPassword: raw.managementPassword ?? "",
    archived: Boolean(raw.archived),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

function readAll(orgId: string): WirelessNetwork[] {
  try {
    const raw = getOrgStorageJson(orgId, ORG_STORAGE_KEYS.wireless);
    const parsed = JSON.parse(raw) as Partial<WirelessNetwork>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeNetwork)
      .filter((item): item is WirelessNetwork => item !== null);
  } catch {
    return [];
  }
}

function writeAll(orgId: string, items: WirelessNetwork[]) {
  setOrgStorageJson(
    orgId,
    ORG_STORAGE_KEYS.wireless,
    JSON.stringify(items)
  );
  window.dispatchEvent(
    new CustomEvent("menschdocs-asset-storage-changed", { detail: { orgId } })
  );
}

export function ensureWirelessStorageLoaded(orgId: string) {
  return ensureOrgStorageLoaded(orgId, ORG_STORAGE_KEYS.wireless);
}

export function listWirelessNetworks(orgId: string): WirelessNetwork[] {
  return readAll(orgId);
}

export function getWirelessNetwork(
  orgId: string,
  networkId: string
): WirelessNetwork | undefined {
  return readAll(orgId).find((network) => network.id === networkId);
}

export function countWirelessNetworks(orgId: string): number {
  return readAll(orgId).filter((item) => !item.archived).length;
}

export function addWirelessNetwork(
  orgId: string,
  input: WirelessNetworkInput
): WirelessNetwork {
  const now = new Date().toISOString();
  const network: WirelessNetwork = {
    id: crypto.randomUUID(),
    ...input,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  writeAll(orgId, [...readAll(orgId), network]);
  return network;
}

export function maskSecret(value: string): string {
  if (!value) return "";
  return "•".repeat(Math.min(value.length, 12));
}
