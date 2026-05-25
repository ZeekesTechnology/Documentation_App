import { ChevronDown, ChevronsUpDown, Columns3, Inbox, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

type ChecklistTab = "checklists" | "my-tasks";
type SortField = "name" | "assignee" | "due";
type SortOrder = "asc" | "desc";

function SortableTh({
  label,
  field,
  sort,
  order,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortField;
  order: SortOrder;
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

export function ChecklistsPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const [tab, setTab] = useState<ChecklistTab>("checklists");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");

  const checklists: never[] = [];
  const filtered = checklists.length;
  const total = checklists.length;
  const countLabel = useMemo(() => `${filtered} of ${total}`, [filtered, total]);

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  return (
    <div className="p-4">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Checklists</h1>
          <div className="mt-3 flex gap-6 border-b border-vault-border">
            <button
              type="button"
              onClick={() => setTab("checklists")}
              className={`border-b-2 pb-2 text-sm ${
                tab === "checklists"
                  ? "border-vault-link text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Checklists
            </button>
            <button
              type="button"
              onClick={() => setTab("my-tasks")}
              className={`border-b-2 pb-2 text-sm ${
                tab === "my-tasks"
                  ? "border-vault-link text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              My Tasks
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1">
          <button type="button" className="btn-secondary">
            <Plus className="h-4 w-4" />
            Import
          </button>
          <button type="button" className="btn-primary">
            <Plus className="h-4 w-4" />
            New
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="mt-4 rounded border border-vault-border bg-vault-panel">
        <div className="flex items-center gap-3 border-b border-vault-border px-3 py-2">
          <input
            type="search"
            placeholder="Filter columns or Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded border border-vault-border bg-vault-bg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:border-vault-green focus:outline-none"
          />
          <span className="shrink-0 text-sm text-gray-500">{countLabel}</span>
          <button
            type="button"
            className="rounded p-1.5 text-gray-400 hover:bg-vault-surface hover:text-white"
            title="Choose columns"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </div>

        {tab === "checklists" ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-vault-border bg-vault-bg/50">
                  <tr>
                    <th className="w-10 px-2 py-2">
                      <span className="inline-flex items-center gap-0.5 text-gray-400">
                        <input
                          type="checkbox"
                          className="rounded border-vault-border bg-vault-bg"
                          disabled
                        />
                        <ChevronDown className="h-3 w-3" />
                      </span>
                    </th>
                    <SortableTh
                      label="Checklist Name"
                      field="name"
                      sort={sort}
                      order={order}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="Assignee"
                      field="assignee"
                      sort={sort}
                      order={order}
                      onSort={handleSort}
                    />
                    <SortableTh
                      label="Due"
                      field="due"
                      sort={sort}
                      order={order}
                      onSort={handleSort}
                    />
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-3 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Inbox className="mb-3 h-12 w-12 text-gray-600" strokeWidth={1.25} />
                        <p className="text-sm text-gray-400">No Checklists</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-3 py-16 text-center">
            <Inbox className="mb-3 h-12 w-12 text-gray-600" strokeWidth={1.25} />
            <p className="text-sm text-gray-400">No tasks assigned to you</p>
          </div>
        )}
      </section>

      {!orgId && (
        <p className="mt-4 text-sm text-red-400">Organization not found.</p>
      )}
    </div>
  );
}
