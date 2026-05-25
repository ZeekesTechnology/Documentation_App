import {
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  Download,
  Inbox,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

type SortField =
  | "primary"
  | "name"
  | "address"
  | "city"
  | "stateProvince"
  | "phone";
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

export function LocationsPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");

  const countLabel = "0 of 0";

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
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-white">Locations</h1>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="btn-import-export"
          >
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" className="btn-primary">
            <Plus className="h-4 w-4" />
            New
          </button>
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
          <span className="shrink-0 text-sm text-gray-500">{countLabel}</span>
          <button
            type="button"
            className="rounded p-1.5 text-gray-400 hover:bg-vault-surface hover:text-white"
            title="Choose columns"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
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
                  label="Primary"
                  field="primary"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Name"
                  field="name"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Address"
                  field="address"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="City"
                  field="city"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="State/Province"
                  field="stateProvince"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Phone"
                  field="phone"
                  sort={sort}
                  onSort={handleSort}
                />
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="px-3 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Inbox
                      className="mb-3 h-12 w-12 text-gray-600"
                      strokeWidth={1.25}
                    />
                    <p className="text-sm text-gray-400">No Locations</p>
                  </div>
                </td>
              </tr>
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
