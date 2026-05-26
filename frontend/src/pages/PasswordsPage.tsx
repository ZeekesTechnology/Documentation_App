import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  FileDown,
  Folder,
  Inbox,
  Key,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DocumentItemActions } from "../components/documents/DocumentItemActions";
import { PasswordStrengthBadge } from "../components/PasswordStrengthBadge";
import {
  addItem,
  countPasswordsInFolder,
  deleteItem,
  ensurePasswordStorageLoaded,
  getFolder,
  listItems,
  organizationPasswordFolderPath,
  organizationPasswordItemPath,
  renameItem,
  type PasswordItem,
  type PasswordScope,
} from "../lib/passwordItems";
import { evaluatePasswordStrength } from "../lib/passwordStrength";

const NEW_PASSWORD_OPTIONS = ["Password", "Folder"] as const;

function emptyCell() {
  return <span className="text-gray-500">—</span>;
}

function passwordSortValue(item: PasswordItem, field: SortField): string {
  switch (field) {
    case "name":
      return item.name;
    case "username":
      return item.username ?? "";
    case "shareable":
      return item.passwordSharing ? "1" : "0";
    case "type":
      return item.kind === "password" ? "Password" : "Folder";
    case "category":
      return item.category ?? "";
    case "security":
      return evaluatePasswordStrength(item.password ?? "")?.level ?? "";
    case "otp":
      return item.otpSecret?.trim() ? "1" : "0";
    case "nextRotation":
      return item.updatedAt ?? "";
    default:
      return "";
  }
}

function matchesPasswordSearch(item: PasswordItem, query: string): boolean {
  if (!query) return true;
  const haystack = [
    item.name,
    item.username,
    item.category,
    item.kind === "password" ? "Password" : "Folder",
    item.passwordSharing ? "shareable yes" : "no",
    item.otpSecret,
    item.url,
    item.notes,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function PasswordRowFields({ item }: { item: PasswordItem }) {
  if (item.kind === "folder") {
    return (
      <>
        <td className="px-3 py-2">{emptyCell()}</td>
        <td className="px-3 py-2">{emptyCell()}</td>
        <td className="px-3 py-2">{emptyCell()}</td>
        <td className="px-3 py-2">{emptyCell()}</td>
        <td className="px-3 py-2">{emptyCell()}</td>
        <td className="px-3 py-2">{emptyCell()}</td>
        <td className="px-3 py-2">{emptyCell()}</td>
      </>
    );
  }

  const hasOtp = Boolean(item.otpSecret?.trim());

  return (
    <>
      <td className="max-w-[180px] truncate px-3 py-2 text-gray-300">
        {item.username?.trim() || emptyCell()}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-gray-300">
        {item.passwordSharing ? (
          <span className="inline-flex items-center gap-1 text-vault-green">
            <Check className="h-3.5 w-3.5" />
            Yes
          </span>
        ) : (
          "No"
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-gray-300">Password</td>
      <td className="max-w-[160px] truncate px-3 py-2 text-gray-300">
        {item.category?.trim() || emptyCell()}
      </td>
      <td className="px-3 py-2">
        <PasswordStrengthBadge password={item.password} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-gray-300">
        {hasOtp ? (
          <span className="inline-flex items-center gap-1 text-vault-green">
            <Check className="h-3.5 w-3.5" />
            Configured
          </span>
        ) : (
          emptyCell()
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-gray-300">
        {emptyCell()}
      </td>
    </>
  );
}

type PasswordTab = PasswordScope;
type SortField =
  | "name"
  | "username"
  | "shareable"
  | "type"
  | "category"
  | "security"
  | "otp"
  | "nextRotation";
type SortOrder = "asc" | "desc";

function SortableTh({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortField;
  onSort: (field: SortField) => void;
}) {
  const active = sort === field;
  return (
    <th className="sortable-th" onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ChevronsUpDown
          className={`h-3.5 w-3.5 ${active ? "text-vault-green" : ""}`}
        />
      </span>
    </th>
  );
}

function refreshItems(
  orgId: string,
  parentId: string | null,
  scope: PasswordScope
) {
  return listItems(orgId, parentId, scope);
}

export function PasswordsPage() {
  const navigate = useNavigate();
  const { id: orgId, folderId } = useParams<{ id: string; folderId?: string }>();
  const [tab, setTab] = useState<PasswordTab>("shared");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sort, setSort] = useState<SortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [items, setItems] = useState<PasswordItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const newMenuRef = useRef<HTMLDivElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const currentFolder =
    orgId && folderId ? getFolder(orgId, folderId) : undefined;
  const parentId = folderId ?? null;
  const scope = currentFolder?.scope ?? tab;

  useEffect(() => {
    if (currentFolder) {
      setTab(currentFolder.scope);
    }
  }, [currentFolder]);

  useEffect(() => {
    if (!orgId) {
      setItems([]);
      return;
    }
    void ensurePasswordStorageLoaded(orgId).then(() => {
      setItems(refreshItems(orgId, parentId, scope));
    });

    const handleStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ orgId: string }>).detail;
      if (detail?.orgId === orgId) {
        setItems(refreshItems(orgId, parentId, scope));
      }
    };

    window.addEventListener(
      "menschdocs-asset-storage-changed",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "menschdocs-asset-storage-changed",
        handleStorageChange
      );
    };
  }, [orgId, parentId, scope]);

  useEffect(() => {
    if (editingItemId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingItemId]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => matchesPasswordSearch(item, query));
  }, [items, search]);

  const visibleItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const left = passwordSortValue(a, sort).toLowerCase();
      const right = passwordSortValue(b, sort).toLowerCase();
      const cmp = left.localeCompare(right);
      return order === "asc" ? cmp : -cmp;
    });
  }, [filteredItems, sort, order]);

  const total = items.length;
  const countLabel = `${visibleItems.length} of ${total}`;

  useEffect(() => {
    if (!newMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        newMenuRef.current &&
        !newMenuRef.current.contains(event.target as Node)
      ) {
        setNewMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [newMenuOpen]);

  useEffect(() => {
    if (showNewFolderForm) {
      folderInputRef.current?.focus();
    }
  }, [showNewFolderForm]);

  const reloadItems = () => {
    if (!orgId) return;
    setItems(refreshItems(orgId, parentId, scope));
  };

  const handleNewOptionClick = (
    option: (typeof NEW_PASSWORD_OPTIONS)[number]
  ) => {
    setNewMenuOpen(false);
    if (option === "Folder") {
      setFolderName("");
      setShowNewFolderForm(true);
      return;
    }
    if (option === "Password" && orgId) {
      addItem(orgId, {
        id: crypto.randomUUID(),
        name: "Untitled Password",
        parentId,
        kind: "password",
        scope,
        updatedAt: new Date().toISOString(),
      });
      reloadItems();
    }
  };

  const handleCreateFolder = () => {
    if (!orgId) return;
    const name = folderName.trim();
    if (!name) return;

    addItem(orgId, {
      id: crypto.randomUUID(),
      name,
      parentId,
      kind: "folder",
      scope,
    });
    reloadItems();
    setFolderName("");
    setShowNewFolderForm(false);
  };

  const startEditing = (item: PasswordItem) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingName("");
  };

  const saveEditing = () => {
    if (!orgId || !editingItemId) return;
    const saved = renameItem(orgId, editingItemId, editingName);
    if (saved) {
      reloadItems();
    }
    cancelEditing();
  };

  const handleDelete = (item: PasswordItem) => {
    if (!orgId) return;
    const label = item.kind === "folder" ? "folder" : "password";
    if (!window.confirm(`Delete this ${label} "${item.name}"?`)) return;

    deleteItem(orgId, item.id);
    if (item.kind === "folder" && folderId === item.id) {
      navigate(`/organizations/${orgId}/passwords`);
      return;
    }
    reloadItems();
  };

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  const emptyMessage =
    scope === "shared" ? "No Passwords" : "No personal passwords";

  if (folderId && orgId && !currentFolder) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-400">Folder not found.</p>
        <Link
          to={`/organizations/${orgId}/passwords`}
          className="mt-2 inline-block text-sm text-vault-link hover:underline"
        >
          Back to Passwords
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Passwords</h1>
          {!folderId && (
            <div className="mt-3 flex gap-6 border-b border-vault-border">
              <button
                type="button"
                onClick={() => setTab("shared")}
                className={`border-b-2 pb-2 text-sm ${
                  tab === "shared"
                    ? "border-vault-link text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Shared
              </button>
              <button
                type="button"
                onClick={() => setTab("personal")}
                className={`border-b-2 pb-2 text-sm ${
                  tab === "personal"
                    ? "border-vault-link text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Personal
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1">
          <button
            type="button"
            className="btn-import-export"
          >
            <FileDown className="h-4 w-4" />
            Import
          </button>
          <div className="relative" ref={newMenuRef}>
            <button
              type="button"
              className="btn-primary"
              aria-expanded={newMenuOpen}
              aria-haspopup="menu"
              onClick={() => setNewMenuOpen((open) => !open)}
            >
              <Plus className="h-4 w-4" />
              New
              <ChevronDown className="h-4 w-4" />
            </button>
            {newMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 min-w-[140px] rounded border border-vault-border bg-vault-panel py-1 shadow-lg"
              >
                {NEW_PASSWORD_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="menuitem"
                    className="block w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-vault-surface hover:text-white"
                    onClick={() => handleNewOptionClick(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-4 rounded border border-vault-border bg-vault-panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-vault-border px-3 py-2">
          <input
            type="search"
            placeholder="Filter columns or Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded border border-vault-border bg-vault-bg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:border-vault-green focus:outline-none"
          />
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-vault-border bg-vault-bg"
            />
            Include archived
          </label>
          <span className="shrink-0 text-sm text-gray-500">{countLabel}</span>
          <button
            type="button"
            className="rounded p-1.5 text-gray-400 hover:bg-vault-surface hover:text-white"
            title="Choose columns"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </div>

        {showNewFolderForm && (
          <div className="border-b border-vault-border px-3 py-3">
            <p className="mb-2 text-sm text-white">Add new folder</p>
            <div className="relative max-w-md">
              <input
                ref={folderInputRef}
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setShowNewFolderForm(false);
                    setFolderName("");
                  }
                }}
                className="w-full rounded border border-vault-border bg-vault-bg py-2 pl-3 pr-10 text-sm text-gray-200 placeholder:text-gray-500 focus:border-vault-green focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!folderName.trim()}
                title="Create folder"
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gray-400 text-vault-bg hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-vault-border bg-vault-bg/50">
              <tr>
                <th className="w-10 px-2 py-2">
                  <span className="inline-flex items-center gap-0.5 text-gray-400">
                    <input
                      type="checkbox"
                      className="rounded border-vault-border bg-vault-bg"
                      disabled={visibleItems.length === 0}
                    />
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </th>
                <SortableTh
                  label="Name"
                  field="name"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Username"
                  field="username"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Shareable"
                  field="shareable"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Type"
                  field="type"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Category"
                  field="category"
                  sort={sort}
                  onSort={handleSort}
                />
                <th
                  className="sortable-th w-12 px-2 py-2"
                  onClick={() => handleSort("security")}
                >
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck
                      className={`h-3.5 w-3.5 ${
                        sort === "security" ? "text-vault-green" : "text-gray-400"
                      }`}
                    />
                    <ChevronsUpDown
                      className={`h-3.5 w-3.5 ${
                        sort === "security" ? "text-vault-green" : ""
                      }`}
                    />
                  </span>
                </th>
                <SortableTh
                  label="OTP"
                  field="otp"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Next Rotation"
                  field="nextRotation"
                  sort={sort}
                  onSort={handleSort}
                />
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Inbox
                        className="mb-3 h-12 w-12 text-gray-600"
                        strokeWidth={1.25}
                      />
                      <p className="text-sm text-gray-400">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => {
                  const passwordCount =
                    orgId && item.kind === "folder"
                      ? countPasswordsInFolder(orgId, item.id)
                      : 0;

                  return (
                    <tr key={item.id} className="table-row">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          className="rounded border-vault-border bg-vault-bg"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {editingItemId === item.id ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditing();
                              if (e.key === "Escape") cancelEditing();
                            }}
                            onBlur={saveEditing}
                            className="w-full min-w-[180px] rounded border border-vault-border bg-vault-bg px-2 py-1 text-sm text-gray-200 focus:border-vault-green focus:outline-none"
                          />
                        ) : item.kind === "folder" && orgId ? (
                          <Link
                            to={organizationPasswordFolderPath(orgId, item.id)}
                            className="inline-flex items-start gap-2 text-vault-link hover:underline"
                          >
                            <Folder className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            <span>
                              <span className="block text-white hover:underline">
                                {item.name}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {passwordCount} Password
                                {passwordCount === 1 ? "" : "s"}
                              </span>
                            </span>
                          </Link>
                        ) : orgId ? (
                          <Link
                            to={organizationPasswordItemPath(orgId, item.id)}
                            className="inline-flex items-center gap-2 text-vault-link hover:underline"
                          >
                            <Key className="h-4 w-4 shrink-0 text-gray-400" />
                            {item.name}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-vault-link">
                            <Key className="h-4 w-4 shrink-0 text-gray-400" />
                            {item.name}
                          </span>
                        )}
                      </td>
                      <PasswordRowFields item={item} />
                      <td className="px-3 py-2">
                        <DocumentItemActions
                          onEdit={() => startEditing(item)}
                          onDelete={() => handleDelete(item)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!orgId && (
        <p className="mt-4 text-sm text-red-400">Organization not found.</p>
      )}
    </div>
  );
}
