import type {
  CreateOrganizationPayload,
  Organization,
  OrganizationsResponse,
  SortField,
  SortOrder,
} from "../types/organization";
import type { AssetCounts, AssetType, OrgAsset } from "../types/assets";

const API = "/api";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return res.json() as Promise<T>;
}

export function fetchOrganizations(params: {
  sort: SortField;
  order: SortOrder;
  search?: string;
  type?: string;
  status?: string;
}) {
  const q = new URLSearchParams({
    sort: params.sort,
    order: params.order,
  });
  if (params.search) q.set("search", params.search);
  if (params.type) q.set("type", params.type);
  if (params.status) q.set("status", params.status);
  return fetchJson<OrganizationsResponse>(`${API}/organizations?${q}`);
}

export function fetchRecents() {
  return fetchJson<{ organizations: Organization[] }>(
    `${API}/organizations/recents`
  );
}

export function fetchFavorites() {
  return fetchJson<{ organizations: Organization[] }>(
    `${API}/organizations/favorites`
  );
}

export function fetchOrganization(id: string) {
  return fetchJson<Organization>(`${API}/organizations/${id}`);
}

export function toggleFavorite(id: string) {
  return fetchJson<{ favorite: boolean }>(
    `${API}/organizations/${id}/favorite`,
    { method: "PATCH" }
  );
}

export function createOrganization(data: CreateOrganizationPayload) {
  return fetchJson<Organization>(`${API}/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateOrganization(
  id: string,
  data: CreateOrganizationPayload
) {
  return fetchJson<Organization>(`${API}/organizations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function uploadOrganizationLogo(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/organizations/${id}/logo`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Upload failed (${res.status})`
    );
  }
  return res.json() as Promise<{ logoPath: string }>;
}

export function deleteOrganization(id: string) {
  return fetchJson<{ ok: boolean }>(`${API}/organizations/${id}`, {
    method: "DELETE",
  });
}

export function updateQuickNotes(
  id: string,
  quickNotes: Record<string, string>
) {
  return fetchJson<Organization>(`${API}/organizations/${id}/quick-notes`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quickNotes }),
  });
}

export interface DashboardData {
  stats: {
    organizations: number;
    activeClients: number;
    favorites: number;
  };
  recentClients: Organization[];
  expiringItems: {
    id: string;
    organization: string;
    item: string;
    dueDate: string;
  }[];
}

export function fetchDashboard() {
  return fetchJson<DashboardData>(`${API}/dashboard`);
}

export function fetchAssetCounts(orgId: string) {
  return fetchJson<{ orgId: string; counts: AssetCounts }>(
    `${API}/organizations/${orgId}/asset-counts`
  );
}

export function fetchOrgAssets(orgId: string, type?: AssetType) {
  const q = type ? `?type=${encodeURIComponent(type)}` : "";
  return fetchJson<{ assets: OrgAsset[] }>(
    `${API}/organizations/${orgId}/assets${q}`
  );
}

export function createOrgAsset(
  orgId: string,
  data: { type: AssetType; title: string }
) {
  return fetchJson<{ asset: OrgAsset; counts: AssetCounts }>(
    `${API}/organizations/${orgId}/assets`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
}

export function deleteOrgAsset(orgId: string, assetId: string) {
  return fetchJson<{ ok: boolean; counts: AssetCounts }>(
    `${API}/organizations/${orgId}/assets/${assetId}`,
    { method: "DELETE" }
  );
}
