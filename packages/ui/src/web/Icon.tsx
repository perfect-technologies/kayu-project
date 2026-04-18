"use client";

import * as React from "react";
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
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Filter,
  SlidersHorizontal,
  Home,
  User,
  Calendar,
  Inbox,
  Plus,
  Check,
  Share,
  Phone,
  Send,
  AlertCircle,
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
      size={size}
      strokeWidth={stroke}
      stroke={strokeColor}
      {...(rest as LucideProps)}
    />
  );
  C.displayName = Cmp.displayName || "Icon";
  return C;
};

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
  chevronRight: wrap(ChevronRight),
  chevronDown: wrap(ChevronDown),
  menu: wrap(Menu),
  x: wrap(X),
  filter: wrap(Filter),
  sliders: wrap(SlidersHorizontal),
  home: wrap(Home),
  user: wrap(User),
  calendar: wrap(Calendar),
  inbox: wrap(Inbox),
  plus: wrap(Plus),
  check: wrap(Check),
  share: wrap(Share),
  phone: wrap(Phone),
  send: wrap(Send),
  alertCircle: wrap(AlertCircle),
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
    size={size}
    strokeWidth={stroke}
    stroke={strokeColor}
    {...(rest as LucideProps)}
  />
);
