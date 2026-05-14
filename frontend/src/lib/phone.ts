const UZ_PREFIX = "+998";

export function formatUzPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 9));
  return parts.length ? `${UZ_PREFIX} ${parts.join(" ")}` : UZ_PREFIX + " ";
}

export function toE164(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  return digits.startsWith("998") ? `+${digits}` : `+998${digits}`;
}

export function isValidUzPhone(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("998");
}
