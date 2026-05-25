import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  FileDown,
  FileText,
  Flag,
  Folder,
  Inbox,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DocumentItemActions } from "../components/documents/DocumentItemActions";
import {
  addItem,
  countDocumentsInFolder,
  deleteItem,
  ensureDocumentStorageLoaded,
  getFolder,
  listItems,
  organizationDocumentFolderPath,
  renameItem,
  type DocumentItem,
} from "../lib/documentFolders";

type SortField =
  | "flag"
  | "name"
  | "updated"
  | "updatedBy"
  | "expires"
  | "owner"
  | "helpCenter"
  | "public";
type SortOrder = "asc" | "desc";

const NEW_DOCUMENT_OPTIONS = [
  "Document",
  "Folder",
  "File Upload",
  "Microsoft Word (.docx)",
  "Microsoft Excel (.xlsx)",
  "Microsoft PowerPoint (.pptx)",
] as const;

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

function refreshItems(orgId: string, parentId: string | null) {
  return listItems(orgId, parentId);
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const { id: orgId, folderId } = useParams<{ id: string; folderId?: string }>();
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sort, setSort] = useState<SortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [items, setItems] = useState<DocumentItem[]>(() =>
    orgId ? refreshItems(orgId, folderId ?? null) : []
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const newMenuRef = useRef<HTMLDivElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const currentFolder =
    orgId && folderId ? getFolder(orgId, folderId) : undefined;
  const parentId = folderId ?? null;

  useEffect(() => {
    if (!orgId) {
      setItems([]);
      return;
    }
    void ensureDocumentStorageLoaded(orgId).then(() => {
      setItems(refreshItems(orgId, parentId));
    });
  }, [orgId, parentId]);

  useEffect(() => {
    if (editingItemId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingItemId]);

  const filteredItems = items.filter((item) => {
    const q = search.trim().toLowerCase();
    return !q || item.name.toLowerCase().includes(q);
  });

  const total = items.length;
  const countLabel = `${filteredItems.length} of ${total}`;

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
    setItems(refreshItems(orgId, parentId));
  };

  const handleNewOptionClick = (option: (typeof NEW_DOCUMENT_OPTIONS)[number]) => {
    setNewMenuOpen(false);
    if (option === "Folder") {
      setFolderName("");
      setShowNewFolderForm(true);
      return;
    }
    if (option === "Document" && orgId) {
      addItem(orgId, {
        id: crypto.randomUUID(),
        name: "Untitled Document",
        parentId,
        kind: "document",
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
    });
    reloadItems();
    setFolderName("");
    setShowNewFolderForm(false);
  };

  const startEditing = (item: DocumentItem) => {
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

  const handleDelete = (item: DocumentItem) => {
    if (!orgId) return;
    const label = item.kind === "folder" ? "folder" : "document";
    if (!window.confirm(`Delete this ${label} "${item.name}"?`)) return;

    deleteItem(orgId, item.id);
    if (item.kind === "folder" && folderId === item.id) {
      navigate(`/organizations/${orgId}/documents`);
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

  if (folderId && orgId && !currentFolder) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-400">Folder not found.</p>
        <Link
          to={`/organizations/${orgId}/documents`}
          className="mt-2 inline-block text-sm text-vault-link hover:underline"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-white">Documents</h1>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="btn-import-export"
          >
            <FileDown className="h-4 w-4" />
            Import
            <ChevronDown className="h-4 w-4" />
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
                className="absolute right-0 z-20 mt-1 min-w-[220px] rounded border border-vault-border bg-vault-panel py-1 shadow-lg"
              >
                {NEW_DOCUMENT_OPTIONS.map((option) => (
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

      <section className="rounded border border-vault-border bg-vault-panel">
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
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="border-b border-vault-border bg-vault-bg/50">
              <tr>
                <th className="w-10 px-2 py-2">
                  <span className="inline-flex items-center gap-0.5 text-gray-400">
                    <input
                      type="checkbox"
                      className="rounded border-vault-border bg-vault-bg"
                      disabled={filteredItems.length === 0}
                    />
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </th>
                <th
                  className="sortable-th w-12 px-2 py-2"
                  onClick={() => handleSort("flag")}
                >
                  <span className="inline-flex items-center gap-1">
                    <Flag
                      className={`h-3.5 w-3.5 ${
                        sort === "flag" ? "text-vault-green" : "text-gray-400"
                      }`}
                    />
                    <ChevronsUpDown
                      className={`h-3.5 w-3.5 ${
                        sort === "flag" ? "text-vault-green" : ""
                      }`}
                    />
                  </span>
                </th>
                <SortableTh
                  label="Name"
                  field="name"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Updated"
                  field="updated"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Updated By"
                  field="updatedBy"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Expires"
                  field="expires"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Owner"
                  field="owner"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Help Center"
                  field="helpCenter"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Public"
                  field="public"
                  sort={sort}
                  onSort={handleSort}
                />
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Inbox
                        className="mb-3 h-12 w-12 text-gray-600"
                        strokeWidth={1.25}
                      />
                      <p className="text-sm text-gray-400">No Documents</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const documentCount =
                    orgId && item.kind === "folder"
                      ? countDocumentsInFolder(orgId, item.id)
                      : 0;

                  return (
                  <tr key={item.id} className="table-row">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        className="rounded border-vault-border bg-vault-bg"
                      />
                    </td>
                    <td className="px-2 py-2" />
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
                          to={organizationDocumentFolderPath(orgId, item.id)}
                          className="inline-flex items-start gap-2 text-vault-link hover:underline"
                        >
                          <Folder className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                          <span>
                            <span className="block text-white hover:underline">
                              {item.name}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {documentCount} Document
                              {documentCount === 1 ? "" : "s"}
                            </span>
                          </span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-vault-link">
                          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                          {item.name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-500" />
                    <td className="px-3 py-2 text-gray-500" />
                    <td className="px-3 py-2 text-gray-500" />
                    <td className="px-3 py-2 text-gray-500" />
                    <td className="px-3 py-2 text-gray-500" />
                    <td className="px-3 py-2 text-gray-500" />
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
