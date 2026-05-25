import {
  getItem as getDocumentItem,
  organizationDocumentFolderPath,
} from "./documentFolders";
import { organizationAssetPath, organizationHomePath } from "./organizationPaths";
import {
  getItem as getPasswordItem,
  organizationPasswordFolderPath,
  organizationPasswordItemPath,
} from "./passwordItems";

export type BreadcrumbCrumb = {
  label: string;
  to?: string;
};

const ASSET_LABELS: Record<string, string> = {
  checklists: "Checklists",
  configurations: "Configurations",
  contacts: "Contacts",
  documents: "Documents",
  domain_tracker: "Domain Tracker",
  locations: "Locations",
  passwords: "Passwords",
  ssl_tracker: "SSL Tracker",
};

type FolderStore = "documents" | "passwords";

function getFolderItem(orgId: string, folderId: string, store: FolderStore) {
  const getItem = store === "documents" ? getDocumentItem : getPasswordItem;
  const item = getItem(orgId, folderId);
  return item?.kind === "folder" ? item : undefined;
}

function folderChain(
  orgId: string,
  folderId: string,
  store: FolderStore
): BreadcrumbCrumb[] {
  const buildPath =
    store === "documents"
      ? (id: string) => organizationDocumentFolderPath(orgId, id)
      : (id: string) => organizationPasswordFolderPath(orgId, id);

  const chain: BreadcrumbCrumb[] = [];
  let current = getFolderItem(orgId, folderId, store);

  while (current) {
    chain.unshift({ label: current.name, to: buildPath(current.id) });
    current = current.parentId
      ? getFolderItem(orgId, current.parentId, store)
      : undefined;
  }

  return chain;
}

function withCurrent(crumbs: BreadcrumbCrumb[]): BreadcrumbCrumb[] {
  if (crumbs.length === 0) return crumbs;
  return crumbs.map((crumb, index) =>
    index === crumbs.length - 1 ? { label: crumb.label } : crumb
  );
}

function assetCrumb(orgId: string, asset: string): BreadcrumbCrumb {
  return {
    label: ASSET_LABELS[asset] ?? asset,
    to: organizationAssetPath(orgId, asset),
  };
}

export function buildOrgBreadcrumbs(
  pathname: string,
  orgName: string
): BreadcrumbCrumb[] {
  const match = pathname.match(/^\/organizations\/([^/]+)(?:\/(.*))?$/);
  if (!match) return [];

  const orgId = match[1];
  if (orgId === "new") return [];

  const rest = match[2] ?? "";
  const crumbs: BreadcrumbCrumb[] = [
    { label: orgName, to: organizationHomePath(orgId) },
  ];

  if (!rest) {
    return withCurrent(crumbs);
  }

  if (rest === "edit") {
    crumbs.push({ label: "Edit Organization" });
    return crumbs;
  }

  if (rest === "quick-notes/edit") {
    crumbs.push({ label: "Quick Notes" });
    return crumbs;
  }

  const passwordEdit = rest.match(/^passwords\/items\/([^/]+)\/edit$/);
  if (passwordEdit) {
    const itemId = passwordEdit[1];
    const item = getPasswordItem(orgId, itemId);
    crumbs.push(assetCrumb(orgId, "passwords"));
    if (item?.parentId) {
      crumbs.push(...folderChain(orgId, item.parentId, "passwords"));
    }
    if (item?.kind === "password") {
      crumbs.push({
        label: item.name,
        to: organizationPasswordItemPath(orgId, itemId),
      });
    }
    crumbs.push({ label: "Edit Password" });
    return crumbs;
  }

  const passwordDetail = rest.match(/^passwords\/items\/([^/]+)$/);
  if (passwordDetail) {
    const itemId = passwordDetail[1];
    const item = getPasswordItem(orgId, itemId);
    crumbs.push(assetCrumb(orgId, "passwords"));
    if (item?.parentId) {
      crumbs.push(...folderChain(orgId, item.parentId, "passwords"));
    }
    if (item?.kind === "password") {
      crumbs.push({ label: item.name });
    } else {
      crumbs.push({ label: "Password" });
    }
    return crumbs;
  }

  const passwordsFolder = rest.match(/^passwords\/folders\/([^/]+)$/);
  if (passwordsFolder) {
    crumbs.push(assetCrumb(orgId, "passwords"));
    const chain = folderChain(orgId, passwordsFolder[1], "passwords");
    crumbs.push(...chain.slice(0, -1), { label: chain.at(-1)?.label ?? "Folder" });
    return crumbs;
  }

  if (rest === "passwords") {
    crumbs.push({ label: ASSET_LABELS.passwords });
    return crumbs;
  }

  const documentsFolder = rest.match(/^documents\/folders\/([^/]+)$/);
  if (documentsFolder) {
    crumbs.push(assetCrumb(orgId, "documents"));
    const chain = folderChain(orgId, documentsFolder[1], "documents");
    crumbs.push(...chain.slice(0, -1), { label: chain.at(-1)?.label ?? "Folder" });
    return crumbs;
  }

  if (rest === "documents") {
    crumbs.push({ label: ASSET_LABELS.documents });
    return crumbs;
  }

  const asset = rest.split("/")[0];
  if (asset in ASSET_LABELS) {
    crumbs.push({ label: ASSET_LABELS[asset] });
    return crumbs;
  }

  return withCurrent(crumbs);
}

export function isOrgBreadcrumbPath(pathname: string) {
  return (
    /^\/organizations\/[^/]+/.test(pathname) &&
    !pathname.startsWith("/organizations/new")
  );
}
