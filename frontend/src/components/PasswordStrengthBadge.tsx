import {
  evaluatePasswordStrength,
  type PasswordStrengthResult,
} from "../lib/passwordStrength";

const LEVEL_STYLES: Record<
  PasswordStrengthResult["level"],
  string
> = {
  weak: "bg-red-500/15 text-red-400",
  medium: "bg-amber-500/15 text-amber-400",
  high: "bg-emerald-500/15 text-emerald-400",
};

export function PasswordStrengthBadge({ password }: { password?: string }) {
  const result = evaluatePasswordStrength(password ?? "");

  if (!result) {
    return (
      <span className="inline-block rounded bg-vault-surface px-2 py-0.5 text-xs text-gray-500">
        —
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[result.level]}`}
    >
      {result.label}
    </span>
  );
}
