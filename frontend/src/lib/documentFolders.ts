export type DocumentItemKind = "folder" | "document";

export interface DocumentItem {
  id: string;
  name: string;
  parentId: string | null;
  kind: DocumentItemKind;
}

function storageKey(orgId: string) {
  return `menschdocs-folders-${orgId}`;
}

function normalizeItem(raw: Partial<DocumentItem>): DocumentItem | null {
  if (!raw.id || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    parentId: raw.parentId ?? null,
    kind: raw.kind === "document" ? "document" : "folder",
  };
}

function readAll(orgId: string): DocumentItem[] {
  try {
    const raw = sessionStorage.getItem(storageKey(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<DocumentItem>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeItem)
      .filter((item): item is DocumentItem => item !== null);
  } catch {
    return [];
  }
}

function writeAll(orgId: string, items: DocumentItem[]) {
  sessionStorage.setItem(storageKey(orgId), JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent("menschdocs-asset-storage-changed", { detail: { orgId } })
  );
}

export function listItems(
  orgId: string,
  parentId: string | null
): DocumentItem[] {
  return readAll(orgId).filter((item) => item.parentId === parentId);
}

export function getItem(
  orgId: string,
  itemId: string
): DocumentItem | undefined {
  return readAll(orgId).find((item) => item.id === itemId);
}

export function getFolder(
  orgId: string,
  folderId: string
): DocumentItem | undefined {
  const item = getItem(orgId, folderId);
  return item?.kind === "folder" ? item : undefined;
}

export function addItem(orgId: string, item: DocumentItem) {
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

export function countDocumentsInFolder(orgId: string, folderId: string): number {
  return readAll(orgId).filter(
    (item) => item.parentId === folderId && item.kind === "document"
  ).length;
}

export function countAllDocumentItems(orgId: string): number {
  return readAll(orgId).length;
}

export function organizationDocumentFolderPath(orgId: string, folderId: string) {
  return `/organizations/${orgId}/documents/folders/${folderId}`;
}

// Backward-compatible helpers
export type DocumentFolder = DocumentItem;

export function listFolders(orgId: string, parentId: string | null) {
  return listItems(orgId, parentId).filter((item) => item.kind === "folder");
}

export function addFolder(orgId: string, folder: Omit<DocumentItem, "kind">) {
  addItem(orgId, { ...folder, kind: "folder" });
}
