import { ChevronDown, Pencil, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  QUICK_NOTE_SECTIONS,
  isBlankNote,
  normalizeQuickNotes,
} from "../constants/quickNotes";
import { OrgAvatar } from "../components/organizations/OrgTile";
import { fetchOrganization } from "../lib/api";
import { isOrganizationHomePath } from "../lib/organizationPaths";
import type { Organization } from "../types/organization";

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isOrganizationHomePath(location.pathname, id)) return;
    setLoading(true);
    fetchOrganization(id)
      .then(setOrg)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load organization")
      )
      .finally(() => setLoading(false));
  }, [id, location.pathname]);

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Loading…</p>;
  }

  if (error || !org) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">{error ?? "Organization not found"}</p>
        <Link
          to="/organizations"
          className="mt-4 inline-block text-vault-link hover:underline"
        >
          Back to organizations
        </Link>
      </div>
    );
  }

  const notes = normalizeQuickNotes(org.quickNotes);

  return (
    <div className="p-4">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <OrgAvatar initials={org.logoInitials} />
          <div>
            <h1 className="text-2xl font-semibold text-white">{org.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-vault-green">
                {org.status} {org.type}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{org.syncStatus}</span>
            </div>
            {org.description && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
                {org.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded p-2 text-gray-400 hover:text-yellow-400"
          >
            <Star
              className={`h-5 w-5 ${org.favorite ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
          </button>
          <Link to={`/organizations/${org.id}/edit`} className="btn-secondary">
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <button type="button" className="btn-primary">
            <Plus className="h-4 w-4" />
            Quick Add
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="rounded border border-vault-border bg-vault-panel">
        <div className="flex items-center justify-between border-b border-vault-border px-4 py-2">
          <h2 className="text-sm font-semibold text-white">Quick Notes</h2>
          <Link
            to={`/organizations/${org.id}/quick-notes/edit`}
            className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
            title="Edit quick notes"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-px bg-vault-border sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_NOTE_SECTIONS.map(({ key, title }) => {
            const value = notes[key];
            const blank = isBlankNote(value);
            return (
              <div key={key} className="flex min-h-[120px] flex-col bg-vault-panel">
                <div className="border-b border-vault-border bg-vault-surface px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {title}
                </div>
                <div className="min-h-[88px] flex-1 bg-vault-bg px-3 py-2 text-sm leading-relaxed text-gray-300">
                  {blank ? (
                    <span className="text-transparent select-none">&nbsp;</span>
                  ) : (
                    <div
                      className="max-w-none [&_a]:text-vault-link [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-vault-border [&_blockquote]:pl-3 [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
                      dangerouslySetInnerHTML={{ __html: value }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
