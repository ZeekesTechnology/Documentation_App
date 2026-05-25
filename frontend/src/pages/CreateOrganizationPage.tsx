import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createOrganization,
  fetchOrganization,
  fetchOrganizations,
  updateOrganization,
  uploadOrganizationLogo,
} from "../lib/api";
import type { CreateOrganizationPayload } from "../types/organization";

const DEFAULT_TYPES = ["Customer", "Client", "Vendor", "Prospect"];
const DEFAULT_STATUSES = ["Active", "Inactive", "On Hold"];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Mexico",
  "Other",
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

const emptyForm = (): CreateOrganizationPayload & { parentOrgId: string } => ({
  name: "",
  shortName: "",
  type: "",
  status: "",
  locationName: "",
  address: "",
  city: "",
  country: "",
  stateProvince: "",
  zipCode: "",
  description: "",
  alertMessage: "",
  parentOrgId: "",
});

function RequiredLabel({ children }: { children: string }) {
  return (
    <label className="form-label">
      {children}
      <span className="text-white"> *</span>
    </label>
  );
}

function AddNewLink({
  label,
  onAdd,
}: {
  label: string;
  onAdd: (value: string) => void;
}) {
  return (
    <button
      type="button"
      className="form-link mt-1"
      onClick={() => {
        const value = window.prompt(`Add new ${label.toLowerCase()}:`);
        if (value?.trim()) onAdd(value.trim());
      }}
    >
      + Add new
    </button>
  );
}

export function CreateOrganizationPage() {
  const { id: orgId } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = Boolean(orgId && location.pathname.endsWith("/edit"));
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [parentOptions, setParentOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [existingLogoPath, setExistingLogoPath] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations({ sort: "name", order: "asc" })
      .then((res) =>
        setParentOptions(
          res.organizations
            .filter((o) => !isEdit || o.id !== orgId)
            .map((o) => ({ id: o.id, name: o.name }))
        )
      )
      .catch(() => setParentOptions([]));
  }, [isEdit, orgId]);

  useEffect(() => {
    if (!isEdit || !orgId) return;
    setLoading(true);
    fetchOrganization(orgId)
      .then((org) => {
        setForm({
          name: org.name,
          shortName: org.shortName ?? "",
          type: org.type,
          status: org.status,
          locationName: org.locationName ?? "",
          address: org.address ?? "",
          city: org.city ?? "",
          country: org.country ?? "",
          stateProvince: org.stateProvince ?? "",
          zipCode: org.zipCode ?? "",
          description: org.description ?? "",
          alertMessage: org.alertMessage ?? "",
          parentOrgId: org.parentOrgId ?? "",
        });
        setExistingLogoPath(org.logoPath ?? "");
        setTypes((prev) =>
          prev.includes(org.type) ? prev : [...prev, org.type]
        );
        setStatuses((prev) =>
          prev.includes(org.status) ? prev : [...prev, org.status]
        );
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load organization")
      )
      .finally(() => setLoading(false));
  }, [isEdit, orgId]);

  const setField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickLogo = (file: File | null) => {
    if (!file) return;
    if (file.size > 300 * 1024 * 1024) {
      setError("Logo must be 300MB or smaller.");
      return;
    }
    setLogoFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: CreateOrganizationPayload = {
        name: form.name.trim(),
        shortName: form.shortName?.trim() || undefined,
        type: form.type,
        status: form.status,
        locationName: form.locationName.trim(),
        address: form.address.trim(),
        city: form.city?.trim() || undefined,
        country: form.country || undefined,
        stateProvince: form.stateProvince || undefined,
        zipCode: form.zipCode?.trim() || undefined,
        description: form.description?.trim() || undefined,
        alertMessage: form.alertMessage?.trim() || undefined,
        parentOrgId: form.parentOrgId || null,
      };

      const org = isEdit && orgId
        ? await updateOrganization(orgId, payload)
        : await createOrganization(payload);
      if (logoFile) {
        await uploadOrganizationLogo(org.id, logoFile);
      }
      navigate(`/organizations/${org.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update organization"
            : "Failed to create organization"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-gray-500">Loading organization…</p>;
  }

  const cancelTo = isEdit && orgId ? `/organizations/${orgId}` : "/organizations";

  return (
    <div className="mx-auto max-w-3xl p-4 pb-10">
      <h1 className="mb-6 text-xl font-semibold text-white">
        {isEdit ? "Edit Organization" : "Create Organization"}
      </h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel>Name</RequiredLabel>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Short name</label>
            <input
              type="text"
              className="form-input"
              value={form.shortName}
              onChange={(e) => setField("shortName", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel>Type</RequiredLabel>
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => setField("type", e.target.value)}
              required
            >
              <option value="">Please select</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <AddNewLink
              label="type"
              onAdd={(value) => {
                setTypes((prev) =>
                  prev.includes(value) ? prev : [...prev, value]
                );
                setField("type", value);
              }}
            />
          </div>
          <div>
            <RequiredLabel>Status</RequiredLabel>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              required
            >
              <option value="">Please select</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <AddNewLink
              label="status"
              onAdd={(value) => {
                setStatuses((prev) =>
                  prev.includes(value) ? prev : [...prev, value]
                );
                setField("status", value);
              }}
            />
          </div>
        </div>

        <div className="border-t border-vault-border pt-5">
          <p className="mb-4 text-sm text-gray-300">
            Primary location <span className="text-white">*</span>
          </p>

          <div className="space-y-4">
            <div>
              <RequiredLabel>Location name</RequiredLabel>
              <input
                type="text"
                className="form-input"
                value={form.locationName}
                onChange={(e) => setField("locationName", e.target.value)}
                required
              />
            </div>
            <div>
              <RequiredLabel>Address</RequiredLabel>
              <input
                type="text"
                className="form-input"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="form-label">Country</label>
                <select
                  className="form-select"
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                >
                  <option value="">Please select</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">State/province</label>
                {form.country === "United States" ? (
                  <select
                    className="form-select"
                    value={form.stateProvince}
                    onChange={(e) => setField("stateProvince", e.target.value)}
                  >
                    <option value="">Please select</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={form.stateProvince}
                    onChange={(e) => setField("stateProvince", e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className="form-label">Zip/postal code</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.zipCode}
                  onChange={(e) => setField("zipCode", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Logo</label>
          <div
            className={`rounded border-2 border-dashed px-4 py-10 text-center transition ${
              dragOver
                ? "border-vault-logo-green bg-vault-surface/50"
                : "border-gray-500 bg-vault-panel"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickLogo(e.dataTransfer.files[0] ?? null);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
            />
            <p className="text-sm text-gray-300">
              <button
                type="button"
                className="text-vault-link hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse
              </button>{" "}
              or drop file to attach
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Max file size 300MB each
            </p>
            {logoFile ? (
              <p className="mt-3 text-sm text-vault-logo-green">
                Selected: {logoFile.name}
              </p>
            ) : existingLogoPath ? (
              <p className="mt-3 text-sm text-gray-400">
                Current logo on file
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea
            className="form-input min-h-[80px] resize-y"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="form-label">Alert message</label>
          <input
            type="text"
            className="form-input"
            value={form.alertMessage}
            onChange={(e) => setField("alertMessage", e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Displayed on Organization home page
          </p>
        </div>

        <div>
          <label className="form-label">Parent Organization</label>
          <select
            className="form-select"
            value={form.parentOrgId}
            onChange={(e) => setField("parentOrgId", e.target.value)}
          >
            <option value="">None</option>
            {parentOptions.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-vault-border pt-5">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <Link to={cancelTo} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
