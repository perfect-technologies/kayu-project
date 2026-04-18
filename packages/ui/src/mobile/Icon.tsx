import * as React from "react";
import type { ComponentProps, ComponentType } from "react";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
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

// Custom SVG icons for `selfie` and `idCard` — matches web/prototype.
const Selfie: React.FC<IconProps> = ({
  size = 20,
  strokeWidth = 1.75,
  color = "currentColor",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke={color as string}
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="9"
      r="4"
      stroke={color as string}
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 13c1 1 2.5 2 4 2s3-1 4-2"
      stroke={color as string}
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IdCard: React.FC<IconProps> = ({
  size = 20,
  strokeWidth = 1.75,
  color = "currentColor",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      stroke={color as string}
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="9"
      cy="11"
      r="2"
      stroke={color as string}
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="15"
      x2="19"
      y1="10"
      y2="10"
      stroke={color as string}
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
    />
    <Line
      x1="15"
      x2="19"
      y1="14"
      y2="14"
      stroke={color as string}
      strokeWidth={strokeWidth as number}
      strokeLinecap="round"
    />
  </Svg>
);

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

export const Icon: React.FC<IconProps & { as: Lucide }> = ({
  as: As,
  size = 20,
  strokeWidth = 1.75,
  ...rest
}) => <As size={size} strokeWidth={strokeWidth} {...rest} />;
