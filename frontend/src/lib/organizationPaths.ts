/** Organization home — detail view with Quick Notes. */
export function organizationHomePath(orgId: string) {
  return `/organizations/${orgId}`;
}

export function organizationAssetPath(orgId: string, asset: string) {
  return `/organizations/${orgId}/${asset}`;
}

export function isOrganizationHomePath(pathname: string, orgId: string) {
  return pathname === organizationHomePath(orgId);
}
