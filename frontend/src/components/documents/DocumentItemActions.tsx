import { SquarePen, Trash2, Unlock } from "lucide-react";

export function DocumentItemActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
        title="Edit"
      >
        <SquarePen className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
        title="Permissions"
        disabled
      >
        <Unlock className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded p-1 text-gray-400 hover:bg-vault-surface hover:text-white"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
