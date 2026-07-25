const DRC_CODE = "+243";
const CONGO_CODE = "+242";

export class InvalidDRCMobilePhoneError extends Error {
  constructor() {
    super("Phone must be a plausible DRC mobile number");
    this.name = "InvalidDRCMobilePhoneError";
  }
}

/**
 * Canonical campaign/mobile validator for DRC numbers.
 *
 * Accepts +243, 243, 0-prefixed, or 9-digit local forms and returns E.164.
 * It rejects foreign numbers, non-mobile prefixes, length errors, and common
 * placeholder patterns. This function intentionally throws so callers cannot
 * accidentally persist a best-effort normalization.
 */
export function normalizePlausibleDRCMobilePhone(input: string): string {
  const compact = input.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) {
    throw new InvalidDRCMobilePhoneError();
  }

  let local = compact;
  if (local.startsWith("+243")) {
    local = local.slice(4);
  } else if (local.startsWith("243")) {
    local = local.slice(3);
  } else if (local.startsWith("0")) {
    local = local.slice(1);
  } else if (local.startsWith("+")) {
    throw new InvalidDRCMobilePhoneError();
  }

  if (
    !/^[89]\d{8}$/.test(local) ||
    new Set(local).size < 4 ||
    /^(\d)\1{8}$/.test(local) ||
    /\d{3}0{6}$/.test(local) ||
    ["012345678", "123456789", "987654321"].includes(local)
  ) {
    throw new InvalidDRCMobilePhoneError();
  }

  return `${DRC_CODE}${local}`;
}

export function isPlausibleDRCMobilePhone(input: string): boolean {
  try {
    normalizePlausibleDRCMobilePhone(input);
    return true;
  } catch {
    return false;
  }
}

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
