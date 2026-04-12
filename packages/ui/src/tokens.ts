export const colors = {
  primary: {
    DEFAULT: "#1E3A8A",
    light: "#3B82F6",
    dark: "#1E40AF",
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  success: {
    DEFAULT: "#10B981",
    light: "#ECFDF5",
    dark: "#059669",
  },
  warning: {
    DEFAULT: "#F59E0B",
    light: "#FFFBEB",
    dark: "#D97706",
  },
  error: {
    DEFAULT: "#EF4444",
    light: "#FEF2F2",
    dark: "#DC2626",
  },
  info: {
    DEFAULT: "#3B82F6",
    light: "#EFF6FF",
    dark: "#2563EB",
  },
  background: "#FFFFFF",
  surface: "#F8FAFC",
  text: {
    primary: "#0F172A",
    secondary: "#475569",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
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
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
} as const;

export const brand = {
  APP_NAME: "KAYOU",
  APP_TAGLINE: "Trouvez le prestataire idéal",
} as const;
