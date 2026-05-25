import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchOrganization } from "../../lib/api";
import {
  buildOrgBreadcrumbs,
  isOrgBreadcrumbPath,
  type BreadcrumbCrumb,
} from "../../lib/orgBreadcrumbs";

export function OrgBreadcrumb() {
  const { pathname } = useLocation();
  const [crumbs, setCrumbs] = useState<BreadcrumbCrumb[]>([]);

  useEffect(() => {
    if (!isOrgBreadcrumbPath(pathname)) {
      setCrumbs([]);
      return;
    }

    const orgId = pathname.match(/^\/organizations\/([^/]+)/)?.[1];
    if (!orgId) {
      setCrumbs([]);
      return;
    }

    let cancelled = false;

    const load = () => {
      fetchOrganization(orgId)
        .then((org) => {
          if (!cancelled) {
            setCrumbs(buildOrgBreadcrumbs(pathname, org.name));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCrumbs(buildOrgBreadcrumbs(pathname, "Organization"));
          }
        });
    };

    load();

    const handleStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ orgId: string }>).detail;
      if (detail?.orgId === orgId) {
        load();
      }
    };

    window.addEventListener(
      "menschdocs-asset-storage-changed",
      handleStorageChange
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "menschdocs-asset-storage-changed",
        handleStorageChange
      );
    };
  }, [pathname]);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-t border-vault-border px-4 py-2 text-sm"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => (
          <li
            key={`${crumb.label}-${index}`}
            className="inline-flex items-center"
          >
            {index > 0 && <span className="px-1 text-gray-500">/</span>}
            {crumb.to ? (
              <Link
                to={crumb.to}
                className="text-gray-400 hover:text-white hover:underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-white">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
