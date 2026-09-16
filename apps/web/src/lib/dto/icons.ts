import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ALIASES: Record<string, string> = { Home: "House", MoreHorizontal: "Ellipsis" };

/** Server-safe lookup of a Lucide icon by the name stored on `Category.icon`; `Tag` when unknown. */
export function lucideIcon(name: string | null | undefined): LucideIcon {
  const key = (name ?? "").trim();
  const resolved = (Lucide as unknown as Record<string, unknown>)[ALIASES[key] ?? key];
  return typeof resolved === "function" || (typeof resolved === "object" && resolved !== null)
    ? (resolved as LucideIcon)
    : Lucide.Tag;
}
