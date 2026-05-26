import { Copy, Eye, EyeOff, MapPin } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { organizationAssetPath } from "../lib/organizationPaths";
import {
  addWirelessNetwork,
  ensureWirelessStorageLoaded,
} from "../lib/wirelessNetworks";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
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
      disabled={!value}
      className="rounded p-1.5 text-gray-400 hover:bg-vault-surface hover:text-white disabled:opacity-40"
      title={copied ? "Copied" : "Copy"}
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="border-b border-vault-border py-4 last:border-b-0">
      <p className="mb-2 text-sm font-semibold text-white">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded border border-vault-border bg-vault-bg px-2 py-1 text-sm text-gray-200 hover:bg-vault-surface"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {visible ? "Hide Password" : "Show Password"}
        </button>
        <input
          type={visible ? "text" : "password"}
          className="form-input min-w-[200px] flex-1 font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
}) {
  return (
    <div className="border-b border-vault-border py-4 last:border-b-0">
      <p className="mb-2 text-sm font-semibold text-white">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <input
          type="text"
          className="form-input flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function NewWirelessPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [physicalLocation, setPhysicalLocation] = useState("");
  const [ssid, setSsid] = useState("");
  const [encryptionType, setEncryptionType] = useState("");
  const [preSharedKey, setPreSharedKey] = useState("");
  const [accessPoints, setAccessPoints] = useState("");
  const [managementIp, setManagementIp] = useState("");
  const [managementUsername, setManagementUsername] = useState("");
  const [managementPassword, setManagementPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wirelessPath = orgId ? organizationAssetPath(orgId, "wireless") : "/organizations";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgId) return;

    const trimmedDescription = description.trim();
    const trimmedSsid = ssid.trim();
    if (!trimmedDescription && !trimmedSsid) {
      setError("Enter a wireless network description or SSID.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await ensureWirelessStorageLoaded(orgId);
      addWirelessNetwork(orgId, {
        description: trimmedDescription,
        physicalLocation: physicalLocation.trim(),
        ssid: trimmedSsid,
        encryptionType: encryptionType.trim(),
        preSharedKey,
        accessPoints: accessPoints.trim(),
        managementIp: managementIp.trim(),
        managementUsername: managementUsername.trim(),
        managementPassword,
      });
      navigate(wirelessPath);
    } catch {
      setError("Could not save wireless network. Please try again.");
      setSaving(false);
    }
  };

  if (!orgId) {
    return <p className="p-4 text-sm text-red-400">Organization not found.</p>;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-white">New Wireless</h1>
        <p className="mt-1 text-sm text-gray-500">Wireless</p>
      </div>

      <form
        className="max-w-3xl rounded border border-vault-border bg-vault-panel px-4 py-2"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <TextField
          label="Wireless Network Description"
          value={description}
          onChange={setDescription}
        />
        <TextField
          label="Physical Location"
          value={physicalLocation}
          onChange={setPhysicalLocation}
          icon={<MapPin className="h-4 w-4 shrink-0 text-gray-500" />}
        />
        <TextField label="SSID" value={ssid} onChange={setSsid} />
        <TextField
          label="Encryption Type"
          value={encryptionType}
          onChange={setEncryptionType}
        />
        <PasswordField
          label="Pre-Shared Key"
          value={preSharedKey}
          onChange={setPreSharedKey}
        />

        <div className="border-b border-vault-border py-4">
          <h2 className="text-base font-semibold text-white">Wireless Devices</h2>
        </div>

        <TextField
          label="Access Point(s)"
          value={accessPoints}
          onChange={setAccessPoints}
        />
        <TextField
          label="Management IP Address"
          value={managementIp}
          onChange={setManagementIp}
        />
        <TextField
          label="OLD - Management Username (Check related password asset on side)"
          value={managementUsername}
          onChange={setManagementUsername}
        />
        <PasswordField
          label="Management Password"
          value={managementPassword}
          onChange={setManagementPassword}
        />

        <div className="flex items-center gap-3 border-t border-vault-border py-4">
          <Link to={wirelessPath} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {error && (
          <p className="pb-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
