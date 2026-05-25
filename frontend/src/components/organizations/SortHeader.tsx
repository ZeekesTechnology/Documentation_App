import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { SortField, SortOrder } from "../../types/organization";

interface SortHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: SortHeaderProps) {
  const active = currentSort === field;
  const Icon = active
    ? currentOrder === "asc"
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown;

  return (
    <th className="sortable-th" onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? "text-vault-green" : ""}`} />
      </span>
    </th>
  );
}
