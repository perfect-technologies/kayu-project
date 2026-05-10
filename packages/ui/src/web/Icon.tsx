"use client";

import * as React from "react";
import * as LucideAll from "lucide-react";
import { Tag } from "lucide-react";
import {
  Search,
  MapPin,
  Star,
  Heart,
  BadgeCheck,
  ShieldCheck,
  Award,
  Clock,
  Wrench,
  MessageCircle,
  Coins,
  Zap,
  Sparkles,
  Scissors,
  Laptop,
  Leaf,
  Paintbrush,
  Car,
  Hammer,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Filter,
  SlidersHorizontal,
  Home,
  User,
  Users,
  Calendar,
  Inbox,
  Plus,
  Check,
  CheckCircle,
  XCircle,
  Share,
  Phone,
  Send,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Pencil,
  FileText,
  FileCheck,
  Percent,
  Copy,
  Info,
  Eye,
  Camera,
  Upload,
  Flag,
  Bell,
  Settings,
  Globe,
  Lock,
  LogOut,
  RefreshCw,
  RotateCw,
  Wifi,
  WifiOff,
  CreditCard,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Server,
  type LucideProps,
} from "lucide-react";

// Our public prop surface overrides LucideProps.stroke (SVG color) with a
// `stroke` number that means stroke-width — matches the prototype DSL.
export type IconProps = Omit<LucideProps, "stroke"> & {
  size?: number;
  stroke?: number;
  strokeColor?: LucideProps["stroke"];
};

const wrap = (
  Cmp: React.ComponentType<LucideProps>,
): React.FC<IconProps> => {
  const C: React.FC<IconProps> = ({
    size = 20,
    stroke = 1.75,
    strokeColor,
    ...rest
  }) => (
    <Cmp
      {...(rest as LucideProps)}
      size={size}
      strokeWidth={stroke}
      color={strokeColor ?? "currentColor"}
      stroke={strokeColor ?? "currentColor"}
    />
  );
  C.displayName = Cmp.displayName || "Icon";
  return C;
};

// Custom SVG icons — not in lucide. Paths lifted verbatim from the v2 prototype.
const Selfie: React.FC<IconProps> = ({
  size = 20,
  stroke = 1.75,
  strokeColor,
  ...rest
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={strokeColor ?? "currentColor"}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...(rest as React.SVGProps<SVGSVGElement>)}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <circle cx="12" cy="9" r="4" />
    <path d="M8 13c1 1 2.5 2 4 2s3-1 4-2" />
  </svg>
);
Selfie.displayName = "Selfie";

const IdCard: React.FC<IconProps> = ({
  size = 20,
  stroke = 1.75,
  strokeColor,
  ...rest
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={strokeColor ?? "currentColor"}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...(rest as React.SVGProps<SVGSVGElement>)}
  >
    <rect width="18" height="14" x="3" y="5" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <line x1="15" x2="19" y1="10" y2="10" />
    <line x1="15" x2="19" y1="14" y2="14" />
  </svg>
);
IdCard.displayName = "IdCard";

export const I = {
  search: wrap(Search),
  mapPin: wrap(MapPin),
  star: wrap(Star),
  heart: wrap(Heart),
  badgeCheck: wrap(BadgeCheck),
  shieldCheck: wrap(ShieldCheck),
  award: wrap(Award),
  clock: wrap(Clock),
  wrench: wrap(Wrench),
  messageCircle: wrap(MessageCircle),
  coins: wrap(Coins),
  zap: wrap(Zap),
  sparkles: wrap(Sparkles),
  scissors: wrap(Scissors),
  laptop: wrap(Laptop),
  leaf: wrap(Leaf),
  paintbrush: wrap(Paintbrush),
  car: wrap(Car),
  hammer: wrap(Hammer),
  arrowRight: wrap(ArrowRight),
  arrowLeft: wrap(ArrowLeft),
  chevronLeft: wrap(ChevronLeft),
  chevronRight: wrap(ChevronRight),
  chevronDown: wrap(ChevronDown),
  menu: wrap(Menu),
  x: wrap(X),
  filter: wrap(Filter),
  sliders: wrap(SlidersHorizontal),
  home: wrap(Home),
  user: wrap(User),
  users: wrap(Users),
  calendar: wrap(Calendar),
  inbox: wrap(Inbox),
  plus: wrap(Plus),
  check: wrap(Check),
  checkCircle: wrap(CheckCircle),
  xCircle: wrap(XCircle),
  share: wrap(Share),
  phone: wrap(Phone),
  send: wrap(Send),
  alertCircle: wrap(AlertCircle),
  alertTriangle: wrap(AlertTriangle),
  trash: wrap(Trash2),
  pencil: wrap(Pencil),
  fileText: wrap(FileText),
  fileCheck: wrap(FileCheck),
  percent: wrap(Percent),
  copy: wrap(Copy),
  info: wrap(Info),
  eye: wrap(Eye),
  camera: wrap(Camera),
  upload: wrap(Upload),
  flag: wrap(Flag),
  bell: wrap(Bell),
  settings: wrap(Settings),
  globe: wrap(Globe),
  lock: wrap(Lock),
  logout: wrap(LogOut),
  refresh: wrap(RefreshCw),
  rotate: wrap(RotateCw),
  wifi: wrap(Wifi),
  wifiOff: wrap(WifiOff),
  creditCard: wrap(CreditCard),
  trendingUp: wrap(TrendingUp),
  trendingDown: wrap(TrendingDown),
  moreVertical: wrap(MoreVertical),
  server: wrap(Server),
  selfie: Selfie,
  idCard: IdCard,
} as const;

export type IconName = keyof typeof I;

// Generic wrapper for consumers that want to pass an arbitrary lucide icon
// while still getting the 1.75 stroke / 20px default.
export const Icon: React.FC<IconProps & { as: React.ComponentType<LucideProps> }> = ({
  as: As,
  size = 20,
  stroke = 1.75,
  strokeColor,
  ...rest
}) => (
  <As
    {...(rest as LucideProps)}
    size={size}
    strokeWidth={stroke}
    color={strokeColor ?? "currentColor"}
    stroke={strokeColor ?? "currentColor"}
  />
);

export function resolveLucideIcon(
  name: string | null | undefined,
): React.FC<IconProps> | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  if (trimmed in I) {
    return I[trimmed as IconName] as React.FC<IconProps>;
  }

  const direct = (LucideAll as Record<string, unknown>)[trimmed];
  if (isLucideComponent(direct)) {
    return wrap(direct as React.ComponentType<LucideProps>);
  }
  // lucide-react ships some icons only under an "Icon"-suffixed alias.
  const aliased = (LucideAll as Record<string, unknown>)[`${trimmed}Icon`];
  if (isLucideComponent(aliased)) {
    return wrap(aliased as React.ComponentType<LucideProps>);
  }
  return null;
}

function isLucideComponent(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (
    typeof value === "object" &&
    value !== null &&
    "$$typeof" in (value as Record<string, unknown>)
  ) {
    return true;
  }
  return false;
}

export const FallbackCategoryIcon: React.FC<IconProps> = wrap(Tag);
