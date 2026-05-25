export const ORG_STORAGE_KEYS = {
  passwords: "passwords",
  documents: "documents",
} as const;

export type OrgStorageKey =
  (typeof ORG_STORAGE_KEYS)[keyof typeof ORG_STORAGE_KEYS];

const cache = new Map<string, string>();
const loadPromises = new Map<string, Promise<void>>();

function cacheId(orgId: string, storageKey: OrgStorageKey) {
  return `${orgId}:${storageKey}`;
}

function legacyBrowserKey(orgId: string, storageKey: OrgStorageKey) {
  return storageKey === ORG_STORAGE_KEYS.passwords
    ? `menschdocs-passwords-${orgId}`
    : `menschdocs-folders-${orgId}`;
}

function readLegacyBrowserStorage(orgId: string, storageKey: OrgStorageKey) {
  const key = legacyBrowserKey(orgId, storageKey);
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function writeLegacyBrowserStorage(
  orgId: string,
  storageKey: OrgStorageKey,
  json: string
) {
  const key = legacyBrowserKey(orgId, storageKey);
  localStorage.setItem(key, json);
  sessionStorage.removeItem(key);
}

async function fetchFromBackend(
  orgId: string,
  storageKey: OrgStorageKey
): Promise<string> {
  const res = await fetch(
    `/api/organizations/${orgId}/local-storage/${storageKey}`
  );
  if (!res.ok) {
    throw new Error(`Failed to load ${storageKey} storage (${res.status})`);
  }
  const data = (await res.json()) as { items?: unknown[] };
  return JSON.stringify(Array.isArray(data.items) ? data.items : []);
}

async function saveToBackend(
  orgId: string,
  storageKey: OrgStorageKey,
  json: string
): Promise<void> {
  const items = JSON.parse(json) as unknown[];
  const res = await fetch(
    `/api/organizations/${orgId}/local-storage/${storageKey}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to save ${storageKey} storage (${res.status})`);
  }
}

async function migrateLegacyToBackend(
  orgId: string,
  storageKey: OrgStorageKey,
  json: string
) {
  try {
    await saveToBackend(orgId, storageKey, json);
  } catch {
    /* keep browser copy if backend save fails during migration */
  }
}

export function getOrgStorageJson(
  orgId: string,
  storageKey: OrgStorageKey
): string {
  return cache.get(cacheId(orgId, storageKey)) ?? "[]";
}

export function setOrgStorageJson(
  orgId: string,
  storageKey: OrgStorageKey,
  json: string
) {
  cache.set(cacheId(orgId, storageKey), json);
  writeLegacyBrowserStorage(orgId, storageKey, json);
  void saveToBackend(orgId, storageKey, json).catch(() => {
    /* browser copy remains as fallback */
  });
}

export function ensureOrgStorageLoaded(
  orgId: string,
  storageKey: OrgStorageKey
): Promise<void> {
  const id = cacheId(orgId, storageKey);
  if (cache.has(id)) {
    return Promise.resolve();
  }

  const pending = loadPromises.get(id);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    let json = "[]";

    try {
      json = await fetchFromBackend(orgId, storageKey);
      const parsed = JSON.parse(json) as unknown[];
      if (parsed.length === 0) {
        const legacy = readLegacyBrowserStorage(orgId, storageKey);
        if (legacy) {
          json = legacy;
          await migrateLegacyToBackend(orgId, storageKey, json);
        }
      }
    } catch {
      const legacy = readLegacyBrowserStorage(orgId, storageKey);
      json = legacy ?? "[]";
    }

    cache.set(id, json);
    writeLegacyBrowserStorage(orgId, storageKey, json);
  })().finally(() => {
    loadPromises.delete(id);
  });

  loadPromises.set(id, promise);
  return promise;
}

export function invalidateOrgStorage(orgId: string, storageKey: OrgStorageKey) {
  cache.delete(cacheId(orgId, storageKey));
  loadPromises.delete(cacheId(orgId, storageKey));
}

export function ensureAllOrgStorageLoaded(orgId: string): Promise<void> {
  return Promise.all(
    Object.values(ORG_STORAGE_KEYS).map((key) =>
      ensureOrgStorageLoaded(orgId, key)
    )
  ).then(() => undefined);
}
