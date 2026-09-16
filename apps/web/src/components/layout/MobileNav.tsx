"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ClipboardList,
  Compass,
  House,
  MessageCircle,
  Sparkles,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuth, type AuthRole, type AuthStatus } from "@/contexts/AuthContext";
import { shellCopy } from "@/copy/shell";
import { cn } from "@/lib/utils";
import { isActivePath } from "./Navbar";

type DockTab = { href: string; label: string; icon: LucideIcon };

const dock = shellCopy.dock;

export function dockTabs(status: AuthStatus, role: AuthRole | undefined): DockTab[] {
  if (status === "ready" && role === "PROVIDER") {
    return [
      { href: "/", label: dock.home, icon: House },
      { href: "/mon-espace", label: dock.requests, icon: ClipboardList },
      { href: "/messagerie", label: dock.messages, icon: MessageCircle },
      { href: "/revenus", label: dock.earnings, icon: Wallet },
      { href: "/compte", label: dock.profile, icon: User },
    ];
  }
  if (status === "ready" && role) {
    return [
      { href: "/", label: dock.home, icon: House },
      { href: "/rechercher", label: dock.explore, icon: Compass },
      { href: "/mes-reservations", label: dock.orders, icon: ClipboardList },
      { href: "/messagerie", label: dock.messages, icon: MessageCircle },
      { href: "/compte", label: dock.profile, icon: User },
    ];
  }
  return [
    { href: "/", label: dock.home, icon: House },
    { href: "/rechercher", label: dock.explore, icon: Compass },
    { href: "/services", label: dock.services, icon: Sparkles },
    { href: "/login", label: dock.login, icon: User },
  ];
}

export function MobileNav() {
  const pathname = usePathname() ?? "/";
  const { status, user } = useAuth();
  const reduceMotion = useReducedMotion();
  const tabs = dockTabs(status, user?.role);

  return (
    <nav aria-label={dock.label} className="mobile-dock lg:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5 pt-3 pb-4"
            >
              {active && (
                <motion.span
                  layoutId="active-mobile-tab"
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 34 }
                  }
                  className="absolute bottom-1 h-1 w-9 rounded-full bg-accent"
                />
              )}
              <Icon
                size={24}
                aria-hidden
                strokeWidth={active ? 2.4 : 2}
                className={active ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={cn(
                  "max-w-full truncate text-[11px] leading-none font-semibold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
