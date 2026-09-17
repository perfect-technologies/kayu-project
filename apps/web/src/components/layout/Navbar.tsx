"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useAuth, type AuthRole, type AuthStatus } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { assistantCopy } from "@/copy/assistant";
import { shellCopy } from "@/copy/shell";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "./Logo";

type NavLink = { href: string; label: string };

const nav = shellCopy.nav;

export function navbarLinks(status: AuthStatus, role: AuthRole | undefined): NavLink[] {
  const links: NavLink[] = [
    { href: "/", label: nav.home },
    { href: "/rechercher", label: nav.search },
    { href: "/services", label: nav.services },
  ];
  const signedIn = status === "ready" && role;
  if (!signedIn) {
    links.push({ href: "/premium", label: nav.premium });
    links.push({ href: "/prestataire/nouveau", label: nav.becomeProvider });
    return links;
  }
  links.push({ href: "/messagerie", label: nav.messages });
  if (role === "PROVIDER") {
    links.push({ href: "/mon-espace", label: nav.mySpace });
    links.push({ href: "/premium", label: nav.premium });
  } else {
    if (role === "CLIENT") links.push({ href: "/assistant", label: assistantCopy.nav.label });
    links.push({ href: "/mes-reservations", label: nav.myBookings });
    links.push({ href: "/prestataire/nouveau", label: nav.becomeProvider });
    links.push({ href: "/premium", label: nav.premium });
  }
  if (role === "ADMIN") links.push({ href: "/admin", label: nav.admin });
  return links;
}

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(firstName: string | null, lastName: string | null, fallback: string | null): string {
  const value = `${(firstName ?? "").charAt(0)}${(lastName ?? "").charAt(0)}`.toUpperCase();
  return value || (fallback ?? "").charAt(0).toUpperCase() || "K";
}

function AccountAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link
      href="/compte"
      aria-label={nav.account}
      className="rounded-full ring-2 ring-primary/20 transition hover:ring-primary/40"
    >
      <Avatar className={size === "sm" ? "size-9" : "size-9"}>
        <AvatarImage src={user.avatar ?? undefined} alt="" />
        <AvatarFallback>{initialsOf(user.firstName, user.lastName, user.email ?? user.phone)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const { status, user, signOut } = useAuth();
  const unreadCount = useUnreadNotifications();
  const links = navbarLinks(status, user?.role);
  const signedIn = status === "ready";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label={nav.home} className="flex shrink-0 items-center rounded-full">
          <Logo size={36} />
        </Link>

        <nav aria-label={nav.mainNav} className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold transition",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {signedIn ? (
            <>
              <AccountAvatar />
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <LogOut size={15} aria-hidden />
                {nav.logout}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              {nav.login}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={signedIn ? "/notifications" : "/login"}
            aria-label={nav.notifications}
            className="icon-button relative"
          >
            <Bell size={20} aria-hidden />
            {unreadCount > 0 && (
              <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-accent" />
            )}
          </Link>
          {signedIn ? (
            <AccountAvatar size="sm" />
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              {nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
