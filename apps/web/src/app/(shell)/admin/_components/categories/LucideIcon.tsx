import { lucideIcon } from "@/lib/dto/icons";

/** The icon stored on a taxonomy node, by Lucide name; `Tag` when unknown. */
export function LucideIconView({ name, size = 16, className }: { name: string | null | undefined; size?: number; className?: string }) {
  const Icon = lucideIcon(name);
  return <Icon size={size} className={className} aria-hidden />;
}
