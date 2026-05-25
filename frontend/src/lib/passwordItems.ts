import {
  ensureOrgStorageLoaded,
  getOrgStorageJson,
  ORG_STORAGE_KEYS,
  setOrgStorageJson,
} from "./orgStorage";

export type PasswordItemKind = "folder" | "password";
export type PasswordScope = "shared" | "personal";

export interface PasswordItem {
  id: string;
  name: string;
  parentId: string | null;
  kind: PasswordItemKind;
  scope: PasswordScope;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  updatedAt?: string;
  category?: string;
  passwordSharing?: boolean;
  otpSecret?: string;
}

function normalizeItem(raw: Partial<PasswordItem>): PasswordItem | null {
  if (!raw.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    parentId: raw.parentId ?? null,
    kind: raw.kind === "password" ? "password" : "folder",
    scope: raw.scope === "personal" ? "personal" : "shared",
    username: raw.username ?? "",
    password: raw.password ?? "",
    url: raw.url ?? "",
    notes: raw.notes ?? "",
    updatedAt: raw.updatedAt,
    category: raw.category ?? "",
    passwordSharing: Boolean(raw.passwordSharing),
    otpSecret: raw.otpSecret ?? "",
  };
}

function readAll(orgId: string): PasswordItem[] {
  try {
    const raw = getOrgStorageJson(orgId, ORG_STORAGE_KEYS.passwords);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PasswordItem>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeItem)
      .filter((item): item is PasswordItem => item !== null);
  } catch {
    return [];
  }
}

function writeAll(orgId: string, items: PasswordItem[]) {
  setOrgStorageJson(
    orgId,
    ORG_STORAGE_KEYS.passwords,
    JSON.stringify(items)
  );
  window.dispatchEvent(
    new CustomEvent("menschdocs-asset-storage-changed", { detail: { orgId } })
  );
}

export function ensurePasswordStorageLoaded(orgId: string) {
  return ensureOrgStorageLoaded(orgId, ORG_STORAGE_KEYS.passwords);
}

export function listItems(
  orgId: string,
  parentId: string | null,
  scope: PasswordScope
): PasswordItem[] {
  return readAll(orgId).filter(
    (item) => item.parentId === parentId && item.scope === scope
  );
}

export function getItem(
  orgId: string,
  itemId: string
): PasswordItem | undefined {
  return readAll(orgId).find((item) => item.id === itemId);
}

export function getFolder(
  orgId: string,
  folderId: string
): PasswordItem | undefined {
  const item = getItem(orgId, folderId);
  return item?.kind === "folder" ? item : undefined;
}

export function addItem(orgId: string, item: PasswordItem) {
  writeAll(orgId, [...readAll(orgId), item]);
}

export function renameItem(orgId: string, itemId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const all = readAll(orgId);
  const index = all.findIndex((item) => item.id === itemId);
  if (index === -1) return false;
  all[index] = { ...all[index], name: trimmed };
  writeAll(orgId, all);
  return true;
}

export function updatePasswordItem(
  orgId: string,
  itemId: string,
  updates: Partial<
    Pick<
      PasswordItem,
      | "name"
      | "username"
      | "password"
      | "url"
      | "notes"
      | "category"
      | "passwordSharing"
      | "otpSecret"
      | "updatedAt"
    >
  >
): PasswordItem | undefined {
  const all = readAll(orgId);
  const index = all.findIndex((item) => item.id === itemId);
  if (index === -1) return undefined;

  all[index] = { ...all[index], ...updates };
  writeAll(orgId, all);
  return all[index];
}

export function deleteItem(orgId: string, itemId: string) {
  const all = readAll(orgId);
  const idsToDelete = new Set<string>();

  const collect = (id: string) => {
    idsToDelete.add(id);
    all
      .filter((item) => item.parentId === id)
      .forEach((child) => collect(child.id));
  };

  collect(itemId);
  writeAll(
    orgId,
    all.filter((item) => !idsToDelete.has(item.id))
  );
}

export function countPasswordsInFolder(orgId: string, folderId: string): number {
  return readAll(orgId).filter(
    (item) => item.parentId === folderId && item.kind === "password"
  ).length;
}

export function countAllPasswordEntries(orgId: string): number {
  return readAll(orgId).filter((item) => item.kind === "password").length;
}

export function organizationPasswordFolderPath(orgId: string, folderId: string) {
  return `/organizations/${orgId}/passwords/folders/${folderId}`;
}

export function organizationPasswordItemPath(orgId: string, itemId: string) {
  return `/organizations/${orgId}/passwords/items/${itemId}`;
}

export function organizationPasswordItemEditPath(orgId: string, itemId: string) {
  return `/organizations/${orgId}/passwords/items/${itemId}/edit`;
}

export function passwordListPath(orgId: string, item: PasswordItem) {
  if (item.parentId) {
    return organizationPasswordFolderPath(orgId, item.parentId);
  }
  return `/organizations/${orgId}/passwords`;
}
