export type PasswordStrengthLevel = "weak" | "medium" | "high";

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel;
  label: "Weak" | "Medium" | "High";
};

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "abc123",
  "letmein",
  "welcome",
  "admin",
  "administrator",
  "changeme",
  "monkey",
  "dragon",
  "master",
  "login",
  "passw0rd",
  "iloveyou",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "shadow",
  "superman",
  "trustno1",
]);

const SEQUENTIAL_PATTERN =
  /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|efgh|fghi|ghij|qwerty|asdf)/i;

function countCharacterClasses(password: string) {
  let classes = 0;
  if (/[a-z]/.test(password)) classes += 1;
  if (/[A-Z]/.test(password)) classes += 1;
  if (/\d/.test(password)) classes += 1;
  if (/[^a-zA-Z0-9]/.test(password)) classes += 1;
  return classes;
}

function hasRepeatedCharacters(password: string) {
  return /(.)\1{2,}/.test(password);
}

export function evaluatePasswordStrength(
  password: string
): PasswordStrengthResult | null {
  const value = password.trim();
  if (!value) return null;

  const normalized = value.toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    return { level: "weak", label: "Weak" };
  }

  let score = 0;
  const length = value.length;
  const classes = countCharacterClasses(value);

  if (length >= 16) score += 35;
  else if (length >= 12) score += 25;
  else if (length >= 8) score += 15;
  else if (length >= 6) score += 5;

  score += classes * 12;

  if (length >= 12 && classes >= 3) score += 10;
  if (length >= 16 && classes >= 4) score += 10;

  if (hasRepeatedCharacters(value)) score -= 15;
  if (SEQUENTIAL_PATTERN.test(value)) score -= 15;
  if (/^[a-z]+$/i.test(value)) score -= 10;
  if (/^\d+$/.test(value)) score -= 20;
  if (length < 8) score = Math.min(score, 35);

  let level: PasswordStrengthLevel;
  if (score < 40) level = "weak";
  else if (score < 70) level = "medium";
  else level = "high";

  const label =
    level === "weak" ? "Weak" : level === "medium" ? "Medium" : "High";

  return { level, label };
}
