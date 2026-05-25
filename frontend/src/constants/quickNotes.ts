export const QUICK_NOTE_SECTIONS = [
  { key: "core_services", title: "Core Services" },
  { key: "p1_info", title: "P1 Info" },
  { key: "approvers", title: "Approvers" },
  { key: "regional_contacts", title: "Regional Contacts" },
  { key: "additional_services", title: "Additional Services" },
  { key: "common_items", title: "Common Items" },
  { key: "critical_items", title: "Critical Items" },
  { key: "maintenance", title: "Maintenance" },
] as const;

export type QuickNoteKey = (typeof QUICK_NOTE_SECTIONS)[number]["key"];

export type QuickNotes = Record<QuickNoteKey, string>;

export function emptyQuickNotes(): QuickNotes {
  return Object.fromEntries(
    QUICK_NOTE_SECTIONS.map(({ key }) => [key, ""])
  ) as QuickNotes;
}

const LEGACY_KEYS: Partial<Record<QuickNoteKey, string>> = {
  regional_contacts: "regional",
  critical_items: "critical",
};

export function normalizeQuickNotes(
  raw: Record<string, string> | undefined | null
): QuickNotes {
  const notes = emptyQuickNotes();
  if (!raw) return notes;

  for (const { key } of QUICK_NOTE_SECTIONS) {
    const legacy = LEGACY_KEYS[key];
    notes[key] = raw[key] ?? (legacy ? raw[legacy] : "") ?? "";
  }
  return notes;
}

export function isBlankNote(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const text = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0;
}
