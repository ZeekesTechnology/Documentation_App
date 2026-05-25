import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RichTextToolbar } from "../components/quick-notes/RichTextToolbar";
import {
  QUICK_NOTE_SECTIONS,
  emptyQuickNotes,
  normalizeQuickNotes,
  type QuickNoteKey,
  type QuickNotes,
} from "../constants/quickNotes";
import { fetchOrganization, updateQuickNotes } from "../lib/api";

export function EditQuickNotesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [notes, setNotes] = useState<QuickNotes>(emptyQuickNotes);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeEditor = useRef<HTMLDivElement | null>(null);
  const editorRefs = useRef<Partial<Record<QuickNoteKey, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOrganization(id)
      .then((org) => {
        setOrgName(org.name);
        const normalized = normalizeQuickNotes(org.quickNotes);
        setNotes(normalized);
        requestAnimationFrame(() => {
          for (const { key } of QUICK_NOTE_SECTIONS) {
            const el = editorRefs.current[key];
            if (el) el.innerHTML = normalized[key] || "";
          }
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load quick notes")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleCommand = useCallback((command: string, value?: string) => {
    if (!activeEditor.current) return;
    activeEditor.current.focus();
    document.execCommand(command, false, value);
  }, []);

  const syncFromEditors = useCallback((): QuickNotes => {
    const next = emptyQuickNotes();
    for (const { key } of QUICK_NOTE_SECTIONS) {
      const el = editorRefs.current[key];
      next[key] = el?.innerHTML ?? notes[key] ?? "";
    }
    return next;
  }, [notes]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const payload = syncFromEditors();
      await updateQuickNotes(id, payload);
      navigate(`/organizations/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save quick notes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Loading quick notes…</p>;
  }

  if (error && !orgName) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">{error}</p>
        <Link
          to={id ? `/organizations/${id}` : "/organizations"}
          className="mt-4 inline-block text-vault-link hover:underline"
        >
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">
          Quick Notes — {orgName}
        </h1>
        <Link
          to={`/organizations/${id}`}
          className="text-sm text-vault-link hover:underline"
        >
          Back to organization
        </Link>
      </div>

      <RichTextToolbar onCommand={handleCommand} />

      <div className="mt-2 min-h-0 flex-1 overflow-auto border border-vault-border">
        <div className="grid grid-cols-1 gap-px bg-vault-border sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_NOTE_SECTIONS.map(({ key, title }) => (
            <div key={key} className="flex min-h-[220px] flex-col bg-vault-panel">
              <div className="border-b border-vault-border bg-vault-surface px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                {title}
              </div>
              <div
                ref={(el) => {
                  editorRefs.current[key] = el;
                }}
                contentEditable
                suppressContentEditableWarning
                onFocus={(e) => {
                  activeEditor.current = e.currentTarget;
                }}
                className="quick-note-editor min-h-[180px] flex-1 bg-vault-bg px-3 py-2 text-left text-sm leading-relaxed text-gray-300 outline-none focus:ring-1 focus:ring-inset focus:ring-vault-green/40 [&_a]:text-vault-link [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-vault-border [&_blockquote]:pl-3 [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
                data-placeholder=""
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <Link to={`/organizations/${id}`} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </div>
  );
}
