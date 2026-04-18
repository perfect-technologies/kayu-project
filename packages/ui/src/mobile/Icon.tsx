import * as React from "react";
import type { ComponentProps, ComponentType } from "react";
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
} from "lucide-react-native";

// lucide-react-native's icon components accept ColorValue for `stroke` and a
// numeric `strokeWidth`. Our wrapper forwards them untouched, only defaulting
// size/strokeWidth to KAYOU's 20/1.75 convention.
type Lucide = ComponentType<ComponentProps<typeof Search>>;
export type IconProps = ComponentProps<typeof Search>;

const wrap = (Cmp: Lucide): React.FC<IconProps> => {
  const C: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.75, ...rest }) => (
    <Cmp size={size} strokeWidth={strokeWidth} {...rest} />
  );
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

export const Icon: React.FC<IconProps & { as: Lucide }> = ({
  as: As,
  size = 20,
  strokeWidth = 1.75,
  ...rest
}) => <As size={size} strokeWidth={strokeWidth} {...rest} />;
