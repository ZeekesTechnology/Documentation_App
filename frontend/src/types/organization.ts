export interface Organization {
  id: string;
  name: string;
  shortName: string;
  type: string;
  status: string;
  favorite: boolean;
  syncStatus: string;
  myglueAccount: string;
  description: string;
  alertMessage: string;
  parentOrgId: string | null;
  locationName: string;
  address: string;
  city: string;
  country: string;
  stateProvince: string;
  zipCode: string;
  logoPath: string;
  quickNotes: Record<string, string>;
  logoInitials: string;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  shortName?: string;
  type: string;
  status: string;
  locationName: string;
  address: string;
  city?: string;
  country?: string;
  stateProvince?: string;
  zipCode?: string;
  description?: string;
  alertMessage?: string;
  parentOrgId?: string | null;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  filtered: number;
}

export type SortField = "name" | "type" | "status" | "myglue" | "sync" | "updated";
export type SortOrder = "asc" | "desc";
