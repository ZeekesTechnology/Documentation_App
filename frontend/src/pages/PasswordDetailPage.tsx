import {
  Archive,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Paperclip,
  Plus,
  Shield,
  SquarePen,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRelativeTime } from "../lib/relativeTime";
import { PasswordStrengthBadge } from "../components/PasswordStrengthBadge";
import {
  deleteItem,
  ensurePasswordStorageLoaded,
  getItem,
  organizationPasswordItemEditPath,
  passwordListPath,
} from "../lib/passwordItems";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-vault-border py-3 last:border-b-0">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-200">{children}</dd>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="ml-2 rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
      title={copied ? "Copied" : `Copy ${label}`}
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}

function SidebarSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-vault-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-200 hover:bg-vault-surface/50"
      >
        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="flex-1 font-medium">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && children && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

function PasswordChangedLabel({ iso }: { iso?: string }) {
  const label = useRelativeTime(iso);
  return <>{label}</>;
}

export function PasswordDetailPage() {
  const navigate = useNavigate();
  const { id: orgId, itemId } = useParams<{ id: string; itemId: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [storageRevision, setStorageRevision] = useState(0);

  useEffect(() => {
    if (!orgId) return;

    const handleStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ orgId: string }>).detail;
      if (detail?.orgId === orgId) {
        setStorageRevision((revision) => revision + 1);
      }
    };

    void ensurePasswordStorageLoaded(orgId).then(() => {
      setStorageRevision((revision) => revision + 1);
    });

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
  }, [orgId]);

  const item = useMemo(() => {
    if (!orgId || !itemId) return undefined;
    const found = getItem(orgId, itemId);
    return found?.kind === "password" ? found : undefined;
  }, [orgId, itemId, storageRevision]);

  if (!orgId || !itemId) {
    return <p className="p-4 text-sm text-red-400">Password not found.</p>;
  }

  if (!item) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-400">Password not found.</p>
        <Link
          to={`/organizations/${orgId}/passwords`}
          className="mt-2 inline-block text-sm text-vault-link hover:underline"
        >
          Back to Passwords
        </Link>
      </div>
    );
  }

  const backPath = passwordListPath(orgId, item);

  const handleDelete = () => {
    if (!window.confirm(`Delete password "${item.name}"?`)) return;
    deleteItem(orgId, item.id);
    navigate(backPath);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-white">{item.name}</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            to={organizationPasswordItemEditPath(orgId, item.id)}
            className="btn-secondary"
          >
            <SquarePen className="h-4 w-4" />
            Edit
          </Link>
          <button type="button" className="btn-secondary">
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button type="button" className="btn-secondary">
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button type="button" className="btn-secondary" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded bg-[#4eb0c0] px-3 py-1.5 text-sm font-medium text-black hover:bg-[#45a0ae]"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
          <button type="button" className="btn-secondary">
            <Archive className="h-4 w-4" />
            Archive
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <section className="min-w-0 flex-1 rounded border border-vault-border bg-vault-panel px-4 py-2">
          <dl>
            <DetailRow label="Password Strength">
              <PasswordStrengthBadge password={item.password} />
            </DetailRow>
            <DetailRow label="Username">
              <span className="inline-flex items-center">
                {item.username || "—"}
                <CopyButton value={item.username ?? ""} label="username" />
              </span>
            </DetailRow>
            <DetailRow label="Password">
              <span className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded border border-vault-border bg-vault-bg px-2 py-1 text-sm text-gray-200 hover:bg-vault-surface"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showPassword ? "Hide Password" : "Show Password"}
                </button>
                {showPassword && (
                  <span className="ml-2 font-mono text-gray-300">
                    {item.password || "—"}
                  </span>
                )}
                <CopyButton value={item.password ?? ""} label="password" />
              </span>
            </DetailRow>
            <DetailRow label="URL">
              <span className="inline-flex items-center">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-vault-link hover:underline"
                  >
                    {item.url}
                  </a>
                ) : (
                  "—"
                )}
                <CopyButton value={item.url ?? ""} label="URL" />
              </span>
            </DetailRow>
            <DetailRow label="Notes">
              <span className="whitespace-pre-wrap">{item.notes || "—"}</span>
            </DetailRow>
            <DetailRow label="Password Changed">
              <PasswordChangedLabel iso={item.updatedAt} />
            </DetailRow>
          </dl>
        </section>

        <aside className="w-72 shrink-0 rounded border border-vault-border bg-vault-panel">
          <SidebarSection title="Attachments" icon={Paperclip} defaultOpen>
            <div className="rounded border border-dashed border-vault-border bg-vault-bg px-3 py-8 text-center text-sm text-gray-500">
              <span className="text-vault-link">Browse</span> or drop files to
              attach
              <br />
              Maximum file size of 300MB each
            </div>
          </SidebarSection>
          <SidebarSection title="Related Items" icon={Tag}>
            <button
              type="button"
              className="text-sm text-vault-link hover:underline"
            >
              Add Related Item
            </button>
          </SidebarSection>
          <SidebarSection title="Revisions" icon={Clock} />
          <SidebarSection title="Security" icon={Shield} />
        </aside>
      </div>
    </div>
  );
}
