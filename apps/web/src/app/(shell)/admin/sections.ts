import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Briefcase, CalendarCheck, FileText, Flag, Layers, LayoutDashboard, Mail, MessagesSquare, Settings2, ShieldCheck, Star, Users as UsersIcon, Wrench } from "lucide-react";
import type { AdminSection } from "@/components/layout/AdminRail";
import { adminCopy } from "@/copy/admin";
import { Audit } from "./_sections/Audit";
import { Bookings } from "./_sections/Bookings";
import { Categories } from "./_sections/Categories";
import { Contacts } from "./_sections/Contacts";
import { Content } from "./_sections/Content";
import { Conversations } from "./_sections/Conversations";
import { Overview } from "./_sections/Overview";
import { Providers } from "./_sections/Providers";
import { References } from "./_sections/References";
import { Reports } from "./_sections/Reports";
import { Reviews } from "./_sections/Reviews";
import { System, type SystemProps } from "./_sections/System";
import { Users } from "./_sections/Users";
import { Verification } from "./_sections/Verification";

export type SectionKey = keyof typeof adminCopy.sections;
export type SectionEntry = AdminSection & { key: SectionKey; Component: ComponentType<SystemProps> };

const define = (key: SectionKey, icon: LucideIcon, Component: ComponentType<SystemProps> | ComponentType): SectionEntry => ({
  key,
  label: adminCopy.sections[key],
  icon,
  Component: Component as ComponentType<SystemProps>,
});

/** The 13 K-YOU sections plus the KYC queue, in rail order; `?tab=` keys. */
export const SECTIONS: readonly SectionEntry[] = [
  define("overview", LayoutDashboard, Overview),
  define("users", UsersIcon, Users),
  define("providers", Briefcase, Providers),
  define("verification", ShieldCheck, Verification),
  define("bookings", CalendarCheck, Bookings),
  define("reviews", Star, Reviews),
  define("conversations", MessagesSquare, Conversations),
  define("contacts", Mail, Contacts),
  define("reports", Flag, Reports),
  define("content", FileText, Content),
  define("categories", Layers, Categories),
  define("references", Settings2, References),
  define("audit", Activity, Audit),
  define("system", Wrench, System),
];

/** Old `/dashboard/admin?tab=` keys still deep-linked from bookmarks. */
export const LEGACY_TABS: Record<string, SectionKey> = { moderation: "users", disputes: "reports", payouts: "overview" };

export function resolveSection(tab: string | null): SectionEntry {
  const key = tab && tab in LEGACY_TABS ? LEGACY_TABS[tab] : tab;
  return SECTIONS.find((section) => section.key === key) ?? SECTIONS[0];
}
