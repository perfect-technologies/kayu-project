const DRC_CODE = "+243";
const CONGO_CODE = "+242";

/**
 * Normalize a DRC phone number to E.164 format (+243XXXXXXXXX).
 * Handles inputs like "0998765432", "243998765432", "+243998765432", "998765432".
 */
export function normalizeDRCPhone(input: string): string {
  const digits = input.replace(/[\s\-().+]/g, "");

  if (digits.startsWith("243") && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    return `${DRC_CODE}${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `${DRC_CODE}${digits}`;
  }
  return `${DRC_CODE}${digits}`;
}

/**
 * Normalize a Congo-Brazzaville phone number to E.164 format (+242XXXXXXXXX).
 * Handles inputs like "06XXXXXXX", "242 06XXXXXXX", "+242 06XXXXXXX".
 */
export function normalizeCongoPhone(input: string): string {
  const digits = input.replace(/[\s\-().+]/g, "");

  if (digits.startsWith("242") && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length >= 9) {
    return `${CONGO_CODE}${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `${CONGO_CODE}${digits}`;
  }
  return `${CONGO_CODE}${digits}`;
}

/**
 * Validate whether a phone string matches a valid format for the given country.
 */
export function isValidPhone(
  phone: string,
  country: "RDC" | "Congo",
): boolean {
  const digits = phone.replace(/[\s\-().+]/g, "");

  if (country === "RDC") {
    // DRC: 9 local digits, 12 with country code
    if (digits.startsWith("243")) return digits.length === 12;
    if (digits.startsWith("0")) return digits.length === 10;
    return digits.length === 9;
  }

  // Congo-Brazzaville: 9 local digits, 12 with country code
  if (digits.startsWith("242")) return digits.length === 12;
  if (digits.startsWith("0")) return digits.length === 10;
  return digits.length === 9;
}

/**
 * Format a phone number for display (e.g., "+243 998 765 432").
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/[\s\-().]/g, "");
  const clean = digits.startsWith("+") ? digits : `+${digits}`;

  if (clean.startsWith(DRC_CODE) && clean.length === 13) {
    const local = clean.slice(4);
    return `${DRC_CODE} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  if (clean.startsWith(CONGO_CODE) && clean.length === 13) {
    const local = clean.slice(4);
    return `${CONGO_CODE} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }

  return clean;
}
