type NamedUser = { firstName?: string | null; lastName?: string | null };

export function fullName(user: NamedUser | null | undefined, fallback = "Utilisateur"): string {
  const name = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return name || fallback;
}

export function shortName(user: NamedUser | null | undefined, fallback = "Utilisateur"): string {
  const first = user?.firstName?.trim();
  const lastInitial = user?.lastName?.trim().charAt(0);
  if (!first) return lastInitial ? `${lastInitial.toUpperCase()}.` : fallback;
  return lastInitial ? `${first} ${lastInitial.toUpperCase()}.` : first;
}

export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
