import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getItem,
  organizationPasswordItemPath,
  updatePasswordItem,
} from "../lib/passwordItems";

function generatePassword(length = 20) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function EditPasswordPage() {
  const navigate = useNavigate();
  const { id: orgId, itemId } = useParams<{ id: string; itemId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSharing, setPasswordSharing] = useState(false);
  const [otpSecret, setOtpSecret] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!orgId || !itemId) {
      setLoading(false);
      return;
    }

    const item = getItem(orgId, itemId);
    if (!item || item.kind !== "password") {
      setLoading(false);
      return;
    }

    setName(item.name);
    setCategory(item.category ?? "");
    setUsername(item.username ?? "");
    setPasswordSharing(Boolean(item.passwordSharing));
    setOtpSecret(item.otpSecret ?? "");
    setUrl(item.url ?? "");
    setNotes(item.notes ?? "");
    setLoading(false);
  }, [orgId, itemId]);

  const detailPath =
    orgId && itemId ? organizationPasswordItemPath(orgId, itemId) : "#";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !itemId) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const existing = getItem(orgId, itemId);
    if (!existing || existing.kind !== "password") {
      setError("Password not found.");
      setSaving(false);
      return;
    }

    const passwordChanged = newPassword.trim().length > 0;
    const hasEdits =
      trimmedName !== existing.name ||
      category.trim() !== (existing.category ?? "") ||
      username.trim() !== (existing.username ?? "") ||
      passwordChanged ||
      passwordSharing !== Boolean(existing.passwordSharing) ||
      otpSecret.trim() !== (existing.otpSecret ?? "") ||
      url.trim() !== (existing.url ?? "") ||
      notes.trim() !== (existing.notes ?? "");

    const updated = updatePasswordItem(orgId, itemId, {
      name: trimmedName,
      category: category.trim(),
      username: username.trim(),
      password: passwordChanged ? newPassword : existing.password,
      passwordSharing,
      otpSecret: otpSecret.trim(),
      url: url.trim(),
      notes: notes.trim(),
      updatedAt:
        passwordChanged || hasEdits
          ? new Date().toISOString()
          : existing.updatedAt,
    });

    setSaving(false);
    if (!updated) {
      setError("Failed to save password.");
      return;
    }

    navigate(detailPath);
  };

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Loading password…</p>;
  }

  if (!orgId || !itemId || !getItem(orgId, itemId)) {
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

  return (
    <div className="p-4">
      <h1 className="mb-6 text-xl font-semibold text-white">Edit Password</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-5 rounded border border-vault-border bg-vault-panel p-5"
      >
        <div>
          <label className="form-label">
            Name<span className="text-red-400"> *</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Search and make selection</option>
            <option value="Application">Application</option>
            <option value="Cloud">Cloud</option>
            <option value="Email">Email</option>
            <option value="Network">Network</option>
            <option value="Server">Server</option>
            <option value="Vendor">Vendor</option>
          </select>
        </div>

        <div>
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="form-label mb-0">Password</label>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-vault-link hover:underline"
              onClick={() => setNewPassword(generatePassword())}
            >
              <RefreshCw className="h-4 w-4" />
              Generate
            </button>
          </div>
          <input
            type="text"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave blank to keep the current password
          </p>
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={passwordSharing}
              onChange={(e) => setPasswordSharing(e.target.checked)}
              className="mt-0.5 rounded border-vault-border bg-vault-bg"
            />
            <span>
              <span className="block text-sm text-gray-200">Password Sharing</span>
              <span className="block text-xs text-gray-500">
                Allow this password to be shared outside of MenschDocs.
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="form-label">One-time Password</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter text-based secret key"
            value={otpSecret}
            onChange={(e) => setOtpSecret(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">URL</label>
          <input
            type="url"
            className="form-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea
            className="form-input min-h-[120px] resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-vault-border pt-5">
          <Link to={detailPath} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
