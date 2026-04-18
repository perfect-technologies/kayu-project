// KAYOU Design System v2 — canonical tokens.
// Source of truth mirrored by apps/web (Tailwind + globals.css) and apps/mobile (theme.ts).
// See docs/DESIGN_SYSTEM.md §14 for the contract.

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
    lg: 16,
    xl: 20,
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
