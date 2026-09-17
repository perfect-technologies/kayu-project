import Link from "next/link";
import { Bell, CircleHelp, LayoutDashboard, MapPin, Package, ShieldCheck, Star, Wallet, type LucideIcon } from "lucide-react";
import type { AuthRole } from "@/contexts/AuthContext";
import { compteCopy } from "@/copy/compte";

const copy = compteCopy.quick;

type Tile = { href: string; icon: LucideIcon; title: string; description: string };

function tilesFor(role: AuthRole): Tile[] {
  const shared: Tile[] = [
    { href: "/notifications", icon: Bell, ...copy.notifications },
    { href: "/aide", icon: CircleHelp, ...copy.help },
  ];
  if (role === "PROVIDER") {
    return [
      { href: "/mon-espace", icon: LayoutDashboard, ...copy.space },
      { href: "/revenus", icon: Wallet, ...copy.earnings },
      ...shared,
      { href: "/verification", icon: ShieldCheck, ...copy.verification },
    ];
  }
  return [
    { href: "/avis", icon: Star, ...copy.reviews },
    { href: "/mes-reservations", icon: Package, ...copy.orders },
    ...shared,
    { href: "/adresses", icon: MapPin, ...copy.addresses },
  ];
}

/** Role-aware 2 / 3 column grid of links into the signed-in spaces. */
export function QuickAccessGrid({ role }: { role: AuthRole }) {
  return (
    <nav aria-label={copy.title} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tilesFor(role).map(({ href, icon: Icon, title, description }) => (
        <Link key={href} href={href} className="rounded-[22px] border border-border bg-white p-4 shadow-soft transition hover:border-primary/30">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Icon size={20} aria-hidden strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-sm font-extrabold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </Link>
      ))}
    </nav>
  );
}
