// KAYOU design tokens: the K-YOU visual system frozen in
// docs/kyou-ux-refactor/00-product-and-design-contract.md §9 (values) and §10 (motion).
// `paletteHsl` / `themeCssVariables` feed apps/web globals.css; `palette` (hex) is for inline styles.

export const paletteHsl = {
  background: "48 20% 97%",
  foreground: "172 60% 12%",
  card: "0 0% 100%",
  popover: "0 0% 100%",
  primary: "165 74% 14%",
  primaryForeground: "60 14% 97%",
  secondary: "150 14% 95%",
  muted: "150 14% 94%",
  mutedForeground: "165 10% 40%",
  accent: "43 100% 57%",
  accentForeground: "165 74% 14%",
  destructive: "0 72% 45%",
  border: "155 21% 88%",
  input: "150 14% 92%",
  ring: "165 74% 14%",
  brandGlow: "172 60% 32%",
} as const;

// Status tints use Tailwind's scale: confirmed/verified emerald, pending/boosted amber,
// cancelled red, completed neutral, elite violet, messages blue.
export const palette = {
  background: "#F8F8F3",
  foreground: "#0D2A25",
  card: "#FFFFFF",
  popover: "#FFFFFF",
  primary: "#0A3D36",
  primaryForeground: "#F8F8F3",
  secondary: "#E9F0EB",
  muted: "#EDF2EC",
  mutedForeground: "#5C7971",
  accent: "#FFBD25",
  accentForeground: "#0A3D36",
  destructive: "#C41E1E",
  border: "#DCE5DF",
  input: "#E8EEE9",
  ring: "#0A3D36",
  adminCanvas: "#F4F6F3",
  authCanvas: "#F8FAF7",
  authCanvasMobile: "#F8F8F3",
  star: "#FBBF24",
  focusRing: "#E8AE29",
  // Hover and skeleton shades from the K-YOU stylesheet (not part of §9).
  primaryHover: "#15594C",
  secondaryHover: "#F0F6F1",
  skeleton: "#E7EEE8",
  status: {
    confirmed: { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
    pending: { bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A" },
    cancelled: { bg: "#FEF2F2", fg: "#B91C1C", border: "#FECACA" },
    completed: { bg: "#EDF2EC", fg: "#5C7971", border: "#DCE5DF" },
    elite: { bg: "#F5F3FF", fg: "#7C3AED", border: "#DDD6FE" },
    messages: { bg: "#EFF6FF", fg: "#2563EB", border: "#BFDBFE" },
  },
} as const;

export type StatusTone = keyof typeof palette.status;

export const fonts = {
  heading: "'Sora Variable', system-ui, sans-serif",
  body: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

// Tailwind class strings for the type scale in §9.
export const textStyles = {
  pageTitle: "text-2xl sm:text-3xl font-extrabold tracking-tight",
  hero: "text-3xl sm:text-4xl md:text-5xl leading-[1.15]",
  sectionTitle: "text-base sm:text-lg font-extrabold",
  body: "text-sm",
  caption: "text-xs",
  captionSm: "text-[11px]",
  eyebrow: "text-[10px] font-extrabold tracking-[.19em]",
} as const;

/** Pixels. `base` is shadcn's `--radius` (1.25rem); primary actions are pills. */
export const radii = { base: 20, field: 14, card: 16, cardLg: 24, hero: 32, pill: 9999 } as const;

export const elevation = {
  soft: "0 4px 24px -8px rgba(15,23,42,.12)",
  softLg: "0 16px 48px -12px rgba(15,23,42,.18)",
  brand: "0 16px 40px -12px hsl(172 60% 32% / .5)",
} as const;

/** Max content widths in pixels (Tailwind 7xl, 5xl, 4xl, 3xl, md). Side padding 16 / 24. */
export const containers = {
  marketing: 1280,
  content: 1024,
  dashboard: 896,
  utility: 768,
  auth: 448,
  admin: 1500,
} as const;

export const motion = {
  screenEnterMs: 240,
  screenEnterFromOpacity: 0.45,
  screenEnterRisePx: 7,
  easeScreen: "cubic-bezier(.2,.75,.3,1)",
  pressMs: 140,
  pressScale: 0.975,
  dockIconScale: 0.87,
  pulseMs: 420,
  pulseSizePx: 38,
  pulseMaxLive: 6,
  sheenMs: 1400,
  sheetSpring: { damping: 28, stiffness: 280 },
  dockSpring: { stiffness: 450, damping: 34 },
  wizard: { offsetPx: 24, durationMs: 280 },
  focusRing: { widthPx: 3, offsetPx: 4 },
} as const;

/** `Category.color` per K-YOU root category slug (src/lib/taxonomy.jsx). */
export const categoryColors: Record<string, string> = {
  batiment_construction: "bg-amber-500",
  beaute_bien_etre: "bg-pink-500",
  cuisine_restauration: "bg-orange-500",
  maison_entretien: "bg-teal-500",
  garde_assistance: "bg-rose-500",
  transport_logistique: "bg-blue-500",
  mecanique_auto: "bg-slate-600",
  technologie_numerique: "bg-indigo-500",
  sante: "bg-red-500",
  agriculture_elevage: "bg-green-600",
  education_formation: "bg-cyan-600",
  evenementiel: "bg-fuchsia-500",
  securite: "bg-gray-700",
  energie: "bg-yellow-500",
  textile_mode: "bg-purple-500",
  communication_impression: "bg-sky-600",
  metiers_artisanat: "bg-stone-600",
  services_admin_juridique: "bg-emerald-700",
  autres: "bg-slate-400",
};

/** Tailwind v4 `@theme` variables for apps/web globals.css (04 §A). */
export const themeCssVariables = {
  "--color-background": `hsl(${paletteHsl.background})`,
  "--color-foreground": `hsl(${paletteHsl.foreground})`,
  "--color-card": `hsl(${paletteHsl.card})`,
  "--color-popover": `hsl(${paletteHsl.popover})`,
  "--color-primary": `hsl(${paletteHsl.primary})`,
  "--color-primary-foreground": `hsl(${paletteHsl.primaryForeground})`,
  "--color-secondary": `hsl(${paletteHsl.secondary})`,
  "--color-muted": `hsl(${paletteHsl.muted})`,
  "--color-muted-foreground": `hsl(${paletteHsl.mutedForeground})`,
  "--color-accent": `hsl(${paletteHsl.accent})`,
  "--color-accent-foreground": `hsl(${paletteHsl.accentForeground})`,
  "--color-destructive": `hsl(${paletteHsl.destructive})`,
  "--color-border": `hsl(${paletteHsl.border})`,
  "--color-input": `hsl(${paletteHsl.input})`,
  "--color-ring": `hsl(${paletteHsl.ring})`,
  "--radius": `${radii.base / 16}rem`,
  "--radius-field": `${radii.field}px`,
  "--radius-card": `${radii.card}px`,
  "--radius-card-lg": `${radii.cardLg}px`,
  "--radius-hero": `${radii.hero}px`,
  "--shadow-soft": elevation.soft,
  "--shadow-soft-lg": elevation.softLg,
  "--shadow-brand": elevation.brand,
  "--ease-screen": motion.easeScreen,
} as const;

// ─── Legacy exports (frozen Expo app) ─────────────────────────────────────────
// Everything below keeps apps/mobile and packages/ui/src/mobile compiling during the
// K-YOU refactor (docs/kyou-ux-refactor/README.md §Mobile freeze). Values are the
// pre-refactor ones. Do NOT add new usages; the mobile workstream deletes this block.

export const tokens = {
  color: {
    // Surfaces
    bg: "#FAFAF9",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F5F9",
    surfacePrimary: "#F0F9FF",
    surfaceEmerald: "#ECFDF5",
    surfaceCoral: "#FFF1F2",
    surfaceAmber: "#FFFBEB",
    surfaceRose: "#FEF2F2",
    surfaceExpert: "#EEF2FF",

    // Text
    textPrimary: "#0F172A",
    textBody: "#334155",
    textMuted: "#64748B",
    textSubtle: "#94A3B8",
    textInverse: "#FFFFFF",
    textOnPrimary: "#FFFFFF",

    // Borders
    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",
    borderStrong: "#CBD5E1",

    // Intent
    primary: "#0EA5E9",
    primaryHover: "#0284C7",
    primarySubtle: "#F0F9FF",
    accent: "#FB7185",
    accentSubtle: "#FFF1F2",
    success: "#10B981",
    successSubtle: "#ECFDF5",
    warning: "#F59E0B",
    warningSubtle: "#FFFBEB",
    danger: "#E11D48",
    dangerSubtle: "#FEF2F2",
    expert: "#4F46E5",
    expertSubtle: "#EEF2FF",
  },

  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    // Backward-compatible alias for old consumers. New code should use xl.
    xxl: 28,
    pill: 9999,
  },

  // Two-layer soft shadows. Web consumes the CSS string; mobile derives RN shadow objects.
  shadow: {
    none: "none",
    e1: "0 2px 8px -3px rgba(15,23,42,0.10), 0 1px 2px rgba(15,23,42,0.04)",
    e2: "0 4px 14px -6px rgba(15,23,42,0.10), 0 1px 3px -1px rgba(15,23,42,0.05)",
    e3: "0 8px 28px -10px rgba(15,23,42,0.16), 0 2px 6px -2px rgba(15,23,42,0.06)",
    e4: "0 10px 32px -10px rgba(15,23,42,0.28), 0 2px 6px -2px rgba(15,23,42,0.08)",
    brand: "0 4px 14px -4px rgba(14,165,233,0.30)",
  },

  font: {
    display:
      "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },

  size: {
    displayXL: { fontSize: 36, lineHeight: 38, weight: 700, family: "display" },
    displayL: { fontSize: 28, lineHeight: 32, weight: 700, family: "display" },
    displayM: { fontSize: 24, lineHeight: 28, weight: 600, family: "display" },
    heading: { fontSize: 20, lineHeight: 25, weight: 600, family: "display" },
    bodyL: { fontSize: 17, lineHeight: 26, weight: 400, family: "body" },
    body: { fontSize: 15, lineHeight: 23, weight: 400, family: "body" },
    bodyM: { fontSize: 14, lineHeight: 20, weight: 500, family: "body" },
    caption: { fontSize: 12, lineHeight: 16, weight: 500, family: "body" },
    price: { fontSize: 17, lineHeight: 17, weight: 600, family: "mono" },
    overline: {
      fontSize: 11,
      lineHeight: 13,
      weight: 600,
      family: "body",
      tracking: 0.08,
      transform: "uppercase",
    },
  },

  ease: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.3, 0, 0, 1)",
    exit: "cubic-bezier(0.3, 0, 1, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  duration: {
    fast: 120,
    base: 200,
    slow: 280,
    page: 320,
    celebrate: 600,
  },

  // Abstract "work tile" pairs (DESIGN_SYSTEM §8.5). Keep in sync with
  // docs/design-plan/prototype/components/MobileShell.jsx — PORTFOLIO_BG.
  // `iconName` maps to a key in the platform `I` icon dictionary.
  portfolio: {
    plomberie:    { bg: "#EFF6FF", accent: "#0EA5E9", label: "Plomberie",    iconName: "wrench" },
    electricite:  { bg: "#FEF3C7", accent: "#D97706", label: "Électricité",  iconName: "zap" },
    peinture:     { bg: "#EEF2FF", accent: "#4F46E5", label: "Peinture",     iconName: "paintbrush" },
    coiffure:     { bg: "#FCE7F3", accent: "#BE185D", label: "Coiffure",     iconName: "scissors" },
    informatique: { bg: "#EDE9FE", accent: "#7C3AED", label: "Informatique", iconName: "laptop" },
    menage:       { bg: "#FFE4E6", accent: "#E11D48", label: "Ménage",       iconName: "sparkles" },
    jardinage:    { bg: "#D1FAE5", accent: "#059669", label: "Jardinage",    iconName: "leaf" },
    transport:    { bg: "#E2E8F0", accent: "#475569", label: "Transport",    iconName: "car" },
    menuiserie:   { bg: "#FEF3C7", accent: "#B45309", label: "Menuiserie",   iconName: "hammer" },
  },

  // CategoryTile tints (DESIGN_SYSTEM §6). Keep in sync with
  // docs/design-plan/prototype/components/shared.jsx — CATEGORIES.
  categoryTint: {
    plomberie: { bg: "#CCFBF1", fg: "#0D9488" },
    electricite: { bg: "#FEF3C7", fg: "#D97706" },
    menage: { bg: "#FFE4E6", fg: "#E11D48" },
    coiffure: { bg: "#FCE7F3", fg: "#BE185D" },
    informatique: { bg: "#EDE9FE", fg: "#7C3AED" },
    jardinage: { bg: "#D1FAE5", fg: "#059669" },
    peinture: { bg: "#DBEAFE", fg: "#2563EB" },
    transport: { bg: "#E2E8F0", fg: "#475569" },
    menuiserie: { bg: "#FEF3C7", fg: "#B45309" },
  },
} as const;

export type Tokens = typeof tokens;
export type CategorySlug = keyof typeof tokens.portfolio;

// Photo-forward card helpers, moved from the deleted cards.ts for the frozen mobile cards.

// Minimum data shape every D03 card consumes. Real provider records will be a
// superset; the cards only read these fields.
export type ProviderCardData = {
  id: string;
  firstName: string;
  lastName: string;
  initials?: string;
  profession: string;
  commune?: string;
  city?: string;
  categories: CategorySlug[];
  categoryName?: string;
  categoryIconName?: string;
  categoryColor?: string;
  secondaryCategories?: Array<{
    name: string;
    iconName?: string;
    color?: string;
  }>;
  avatarBg?: string;
  avatarUrl?: string;
  rating: number;
  reviews: number;
  /** "15 min" | "1h" | "3h" — the bare time string. */
  response: string;
  /** Provider starting price in FC (fixed base price, not hourly). Field kept as `hourly` while DB column rename is deferred. */
  hourly: number;
  /** Distance in km. Omit on cards that don't show it. */
  distance?: number;
  verified?: boolean;
  topRated?: boolean;
  online?: boolean;
  /** Years of experience, used as a trust chip on the showcase card. */
  experienceYears?: number;
  /** Short verbatim review used as a quote on the showcase card. */
  testimonial?: string;
};

// Resolve the portfolio category for a provider, defaulting to plomberie when
// the provider has no categories (mirrors the prototype's defensive fallback).
export const portfolioSlug = (
  categories: readonly CategorySlug[] | undefined,
): CategorySlug => categories?.[0] ?? "plomberie";

// Format a price in Congolese francs — "15 000 FC" with French thousand
// separators (NBSP), separator handled by Intl.
export const formatMoneyFc = (amount: number): string =>
  `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FC`;

// Format a starting price for the wide/featured card meta — "15 000" with
// French thousand separators (NBSP), separator handled by Intl.
// Function name kept as `formatHourly` to avoid widespread call-site churn;
// semantically this is the provider starting price.
export const formatHourly = (hourly: number): string =>
  hourly.toLocaleString("fr-FR");

// Compact form for nearby rows — "15k FC".
export const formatHourlyCompact = (hourly: number): string =>
  `${Math.round(hourly / 1000)}k FC`;

// ─── Legacy v1 exports ───────────────────────────────────────────────────────
// Retained so existing mobile screens (33 consumers) keep compiling while
// D05–D07 migrate them to v2. Do NOT add new usages.

export const colors = {
  primary: {
    DEFAULT: tokens.color.primary,
    light: "#7DD3FC",
    dark: tokens.color.primaryHover,
    50: tokens.color.primarySubtle,
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: tokens.color.primary,
    600: tokens.color.primaryHover,
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },
  neutral: {
    50: "#F8FAFC",
    100: tokens.color.surfaceMuted,
    200: tokens.color.border,
    300: tokens.color.borderStrong,
    400: tokens.color.textSubtle,
    500: tokens.color.textMuted,
    600: "#475569",
    700: tokens.color.textBody,
    800: "#1E293B",
    900: tokens.color.textPrimary,
  },
  success: {
    DEFAULT: tokens.color.success,
    light: tokens.color.successSubtle,
    dark: "#059669",
  },
  warning: {
    DEFAULT: tokens.color.warning,
    light: tokens.color.warningSubtle,
    dark: "#D97706",
  },
  error: {
    DEFAULT: tokens.color.danger,
    light: tokens.color.dangerSubtle,
    dark: "#BE123C",
  },
  info: {
    DEFAULT: tokens.color.primary,
    light: tokens.color.primarySubtle,
    dark: tokens.color.primaryHover,
  },
  background: tokens.color.bg,
  surface: tokens.color.surface,
  text: {
    primary: tokens.color.textPrimary,
    secondary: tokens.color.textBody,
    tertiary: tokens.color.textSubtle,
    inverse: tokens.color.textInverse,
  },
} as const;

export const spacing = {
  xs: tokens.space[1],
  sm: tokens.space[2],
  md: tokens.space[4],
  lg: tokens.space[6],
  xl: tokens.space[8],
  xxl: tokens.space[12],
} as const;

export const borderRadius = {
  sm: tokens.radius.sm,
  md: tokens.radius.md,
  lg: tokens.radius.lg,
  xl: tokens.radius.xl,
  full: tokens.radius.pill,
} as const;

export const typography = {
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export const shadows = {
  sm: tokens.shadow.e1,
  md: tokens.shadow.e2,
  lg: tokens.shadow.e3,
} as const;

export const brand = {
  APP_NAME: "KAYOU",
  APP_TAGLINE: "Trouvez la bonne personne.",
} as const;
