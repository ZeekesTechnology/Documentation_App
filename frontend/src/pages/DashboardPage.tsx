import { Building2, Clock, Key, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SystemUsageSection } from "../components/dashboard/SystemUsageSection";
import { OrgTile } from "../components/organizations/OrgTile";
import { fetchDashboard } from "../lib/api";
import type { DashboardData } from "../lib/api";

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Loading dashboard…</p>;
  }

  if (!data) {
    return <p className="p-8 text-center text-red-400">Failed to load dashboard</p>;
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold text-white">Dashboard</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Organizations"
          value={data.stats.organizations}
        />
        <StatCard
          icon={Star}
          label="Favorites"
          value={data.stats.favorites}
        />
        <StatCard
          icon={Key}
          label="Active clients"
          value={data.stats.activeClients}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <section className="rounded border border-vault-border bg-vault-panel p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Clock className="h-4 w-4 text-gray-500" />
              Recently viewed clients
            </h2>
            {data.recentClients.length === 0 ? (
              <p className="text-sm text-gray-500">No recent clients yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.recentClients.map((org) => (
                  <OrgTile key={org.id} org={org} compact />
                ))}
              </div>
            )}
          </section>

          {data.systemUsage && <SystemUsageSection data={data.systemUsage} />}
        </div>

        <section className="rounded border border-vault-border bg-vault-panel p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Expiring passwords / licenses
          </h2>
          <ul className="space-y-2">
            {data.expiringItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded bg-vault-bg px-3 py-2 text-sm"
              >
                <Link
                  to={`/organizations/${item.id}`}
                  className="text-vault-link hover:underline"
                >
                  {item.organization}
                </Link>
                <span className="text-gray-500">{item.item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded border border-vault-border bg-vault-panel p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
