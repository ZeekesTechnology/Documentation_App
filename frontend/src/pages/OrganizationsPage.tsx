import {
  ExternalLink,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteOrganization,
  fetchFavorites,
  fetchOrganizations,
  fetchRecents,
  toggleFavorite,
} from "../lib/api";
import type { Organization, SortField, SortOrder } from "../types/organization";
import { OrgAvatar, OrgTile } from "../components/organizations/OrgTile";
import { SortHeader } from "../components/organizations/SortHeader";

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [recents, setRecents] = useState<Organization[]>([]);
  const [favorites, setFavorites] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [filtered, setFiltered] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, recentData, favData] = await Promise.all([
        fetchOrganizations({ sort, order, search: search || undefined }),
        fetchRecents(),
        fetchFavorites(),
      ]);
      setOrganizations(list.organizations);
      setTotal(list.total);
      setFiltered(list.filtered);
      setRecents(recentData.organizations);
      setFavorites(favData.organizations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [sort, order, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
  };

  const handleFavorite = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(id);
    void load();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this organization?")) return;
    await deleteOrganization(id);
    void load();
  };

  const countLabel = useMemo(
    () => `${filtered} of ${total}`,
    [filtered, total]
  );

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Organizations</h1>
        <Link to="/organizations/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      {recents.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-gray-400">Recents</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recents.map((org) => (
              <OrgTile key={org.id} org={org} compact />
            ))}
          </div>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-gray-400">Favorites</h2>
          <div className="flex flex-wrap gap-2">
            {favorites.map((org) => (
              <OrgTile key={org.id} org={org} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded border border-vault-border bg-vault-panel">
        <div className="flex items-center gap-3 border-b border-vault-border px-3 py-2">
          <input
            type="search"
            placeholder="Filter columns or Search keywords"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded border border-vault-border bg-vault-bg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-500 focus:border-vault-green focus:outline-none"
          />
          <span className="shrink-0 text-sm text-gray-500">{countLabel}</span>
        </div>

        {error && (
          <p className="p-4 text-sm text-red-400">{error}</p>
        )}

        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-vault-border bg-vault-bg/50">
                <tr>
                  <th className="w-10 px-2 py-2" />
                  <th className="w-10 px-2 py-2" />
                  <SortHeader
                    label="Name"
                    field="name"
                    currentSort={sort}
                    currentOrder={order}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Type"
                    field="type"
                    currentSort={sort}
                    currentOrder={order}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Status"
                    field="status"
                    currentSort={sort}
                    currentOrder={order}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Sync Status"
                    field="sync"
                    currentSort={sort}
                    currentOrder={order}
                    onSort={handleSort}
                  />
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="table-row">
                    <td className="px-2 py-2">
                      <input type="checkbox" className="rounded border-vault-border bg-vault-bg" />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => void handleFavorite(org.id, e)}
                        className="text-gray-500 hover:text-yellow-400"
                      >
                        <Star
                          className={`h-4 w-4 ${org.favorite ? "fill-yellow-400 text-yellow-400" : ""}`}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/organizations/${org.id}`}
                        className="flex items-center gap-2 text-vault-link hover:underline"
                      >
                        <OrgAvatar initials={org.logoInitials} small />
                        <span className="font-medium">{org.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-gray-300">{org.type}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          org.status === "Active"
                            ? "text-vault-green"
                            : "text-gray-500"
                        }
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-300">{org.syncStatus}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/organizations/${org.id}`}
                          className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
                          title="Open"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => void handleDelete(org.id, e)}
                          className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {organizations.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      No organizations match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
