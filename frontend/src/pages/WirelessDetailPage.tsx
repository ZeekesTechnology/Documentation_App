import { Copy, Eye, EyeOff, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { organizationAssetPath } from "../lib/organizationPaths";
import {
  ensureWirelessStorageLoaded,
  getWirelessNetwork,
  type WirelessNetwork,
} from "../lib/wirelessNetworks";

function CopyButton({ value }: { value: string }) {
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
      className="rounded p-1.5 text-gray-400 hover:bg-vault-surface hover:text-white"
      title={copied ? "Copied" : "Copy"}
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}

function DetailField({
  label,
  value,
  icon,
  secret,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  secret?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const displayValue = value.trim() || "—";

  return (
    <div className="border-b border-vault-border py-4 last:border-b-0">
      <p className="mb-2 text-sm font-semibold text-white">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {secret && value && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded border border-vault-border bg-vault-bg px-2 py-1 text-sm text-gray-200 hover:bg-vault-surface"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {visible ? "Hide Password" : "Show Password"}
          </button>
        )}
        {icon}
        <span
          className={`min-w-0 flex-1 text-sm ${
            secret ? "font-mono text-gray-200" : "text-gray-300"
          }`}
        >
          {secret && value && !visible ? "•".repeat(Math.min(value.length, 12)) : displayValue}
        </span>
        {secret && value && <CopyButton value={value} />}
        {!secret && value && <CopyButton value={value} />}
      </div>
    </div>
  );
}

function networkTitle(network: WirelessNetwork): string {
  return network.description.trim() || network.ssid.trim() || "Wireless Network";
}

export function WirelessDetailPage() {
  const { id: orgId, networkId } = useParams<{ id: string; networkId: string }>();
  const [network, setNetwork] = useState<WirelessNetwork | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!orgId || !networkId) return;

    let cancelled = false;

    const load = async () => {
      await ensureWirelessStorageLoaded(orgId);
      if (!cancelled) {
        setNetwork(getWirelessNetwork(orgId, networkId) ?? null);
        setLoaded(true);
      }
    };

    void load();

    const handleStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ orgId: string }>).detail;
      if (detail?.orgId === orgId) {
        setNetwork(getWirelessNetwork(orgId, networkId) ?? null);
      }
    };

    window.addEventListener(
      "menschdocs-asset-storage-changed",
      handleStorageChange
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "menschdocs-asset-storage-changed",
        handleStorageChange
      );
    };
  }, [orgId, networkId]);

  const wirelessPath = orgId ? organizationAssetPath(orgId, "wireless") : "/organizations";

  if (!orgId || !networkId) {
    return <p className="p-4 text-sm text-red-400">Organization not found.</p>;
  }

  if (!loaded) {
    return <p className="p-8 text-center text-gray-500">Loading wireless network…</p>;
  }

  if (!network) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-400">Wireless network not found.</p>
        <Link to={wirelessPath} className="mt-3 inline-block text-sm text-vault-link hover:underline">
          Back to Wireless
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link to={wirelessPath} className="text-sm text-vault-link hover:underline">
          ← Back to Wireless
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-white">{networkTitle(network)}</h1>
        <p className="mt-1 text-sm text-gray-500">Wireless</p>
      </div>

      <div className="max-w-3xl rounded border border-vault-border bg-vault-panel px-4 py-2">
        <DetailField label="Wireless Network Description" value={network.description} />
        <DetailField
          label="Physical Location"
          value={network.physicalLocation}
          icon={<MapPin className="h-4 w-4 shrink-0 text-gray-500" />}
        />
        <DetailField label="SSID" value={network.ssid} />
        <DetailField label="Encryption Type" value={network.encryptionType} />
        <DetailField label="Pre-Shared Key" value={network.preSharedKey} secret />

        <div className="border-b border-vault-border py-4">
          <h2 className="text-base font-semibold text-white">Wireless Devices</h2>
        </div>

        <DetailField label="Access Point(s)" value={network.accessPoints} />
        <DetailField label="Management IP Address" value={network.managementIp} />
        <DetailField
          label="OLD - Management Username (Check related password asset on side)"
          value={network.managementUsername}
        />
        <DetailField label="Management Password" value={network.managementPassword} secret />
      </div>
    </div>
  );
}
