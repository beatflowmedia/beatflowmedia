/**
 * BeatFlowMedia Design System Tokens
 * Comprehensive design token system for consistent UI development
 * Based on Spotify-inspired design principles
 */

// Base color palette
export const colors = {
  // Primary colors (Spotify-inspired green)
  primary: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#1DB954", // Primary brand color
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },

  // Surface colors (dark theme focused)
  surface: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#121212", // Primary surface
    950: "#0a0a0a",
  },

  // Muted/neutral colors
  neutral: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#B3B3B3", // Muted text
    600: "#71717a",
    700: "#52525b",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },

  // Semantic colors
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#E5534B", // Danger color
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },

  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },

  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  // Special colors
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",

  // Gradients
  gradients: {
    primary: "linear-gradient(135deg, #1DB954 0%, #1ed760 100%)",
    surface: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)",
    accent: "linear-gradient(135deg, #1DB954 0%, #22c55e 100%)",
  },
} as const;

// Typography scale with fluid responsive sizing
export const typography = {
  // Font families
  fontFamily: {
    sans: [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ],
    mono: [
      "JetBrains Mono",
      "Fira Code",
      "Consolas",
      "Monaco",
      "Courier New",
      "monospace",
    ],
    display: ["Inter Display", "Inter", "system-ui", "sans-serif"],
  },

  // Font weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Font sizes with fluid scaling
  fontSize: {
    xs: {
      mobile: "12px",
      desktop: "12px",
      lineHeight: "16px",
    },
    sm: {
      mobile: "13px",
      desktop: "14px", // PRD spec
      lineHeight: "20px",
    },
    base: {
      mobile: "15px",
      desktop: "16px", // PRD spec
      lineHeight: "24px",
    },
    lg: {
      mobile: "17px",
      desktop: "18px",
      lineHeight: "28px",
    },
    xl: {
      mobile: "19px",
      desktop: "22px", // PRD spec
      lineHeight: "32px",
    },
    "2xl": {
      mobile: "23px",
      desktop: "28px",
      lineHeight: "36px",
    },
    "3xl": {
      mobile: "28px",
      desktop: "36px",
      lineHeight: "44px",
    },
    "4xl": {
      mobile: "33px",
      desktop: "48px",
      lineHeight: "56px",
    },
    "5xl": {
      mobile: "40px",
      desktop: "64px",
      lineHeight: "72px",
    },
    "6xl": {
      mobile: "48px",
      desktop: "80px",
      lineHeight: "88px",
    },
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

// Spacing system with consistent rhythm
export const spacing = {
  // Base spacing units
  xs: "4px", // PRD spec
  sm: "8px", // PRD spec
  md: "16px", // PRD spec
  lg: "24px", // PRD spec
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
  "5xl": "128px",
  "6xl": "192px",

  // Semantic spacing
  component: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },

  layout: {
    xs: "8px",
    sm: "16px",
    md: "24px",
    lg: "32px",
    xl: "48px",
    "2xl": "64px",
  },

  container: {
    xs: "16px",
    sm: "24px",
    md: "32px",
    lg: "48px",
    xl: "64px",
  },
} as const;

// Motion and animation tokens
export const motion = {
  // Duration
  duration: {
    instant: "0ms",
    fast: "120ms", // PRD spec
    normal: "240ms", // PRD spec
    slow: "400ms",
    slower: "600ms",
  },

  // Easing curves
  easing: {
    linear: "cubic-bezier(0, 0, 1, 1)",
    ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    spotify: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Spotify-like easing
  },

  // Spring configurations
  spring: {
    gentle: {
      tension: 120,
      friction: 14,
    },
    wobbly: {
      tension: 180,
      friction: 12,
    },
    stiff: {
      tension: 210,
      friction: 20,
    },
  },
} as const;

// Border radius tokens
export const radius = {
  none: "0px",
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  full: "9999px",

  // Component-specific radius
  button: "8px",
  card: "12px",
  modal: "16px",
  input: "6px",
  avatar: "50%",
} as const;

// Shadow and elevation system
export const shadows = {
  none: "none",
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",

  // Dark theme shadows
  dark: {
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.6)",
  },

  // Colored shadows
  colored: {
    primary: "0 4px 14px 0 rgb(29 185 84 / 0.25)",
    danger: "0 4px 14px 0 rgb(229 83 75 / 0.25)",
    success: "0 4px 14px 0 rgb(34 197 94 / 0.25)",
    warning: "0 4px 14px 0 rgb(245 158 11 / 0.25)",
    info: "0 4px 14px 0 rgb(59 130 246 / 0.25)",
  },
} as const;

// Breakpoint system for responsive design
export const breakpoints = {
  values: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },

  // Media queries
  up: (breakpoint: keyof typeof breakpoints.values) =>
    `@media (min-width: ${breakpoints.values[breakpoint]}px)`,

  down: (breakpoint: keyof typeof breakpoints.values) =>
    `@media (max-width: ${breakpoints.values[breakpoint] - 1}px)`,

  between: (
    min: keyof typeof breakpoints.values,
    max: keyof typeof breakpoints.values,
  ) =>
    `@media (min-width: ${breakpoints.values[min]}px) and (max-width: ${breakpoints.values[max] - 1}px)`,

  only: (breakpoint: keyof typeof breakpoints.values) => {
    const breakpointKeys = Object.keys(
      breakpoints.values,
    ) as (keyof typeof breakpoints.values)[];
    const index = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[index + 1];

    if (nextBreakpoint) {
      return breakpoints.between(breakpoint, nextBreakpoint);
    }
    return breakpoints.up(breakpoint);
  },
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      xs: "24px",
      sm: "32px",
      md: "40px",
      lg: "48px",
      xl: "56px",
    },
    padding: {
      xs: "4px 8px",
      sm: "6px 12px",
      md: "8px 16px",
      lg: "12px 24px",
      xl: "16px 32px",
    },
    fontSize: {
      xs: typography.fontSize.xs,
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
      xl: typography.fontSize.xl,
    },
  },

  input: {
    height: {
      sm: "32px",
      md: "40px",
      lg: "48px",
    },
    padding: {
      sm: "6px 12px",
      md: "8px 16px",
      lg: "12px 16px",
    },
  },

  card: {
    padding: {
      sm: spacing.md,
      md: spacing.lg,
      lg: spacing.xl,
    },
  },
} as const;

// Semantic color mappings for light and dark themes
export const semanticColors = {
  light: {
    // Text colors
    text: {
      primary: colors.surface[900],
      secondary: colors.neutral[700],
      muted: colors.neutral[500],
      inverse: colors.white,
    },

    // Background colors
    background: {
      primary: colors.white,
      secondary: colors.surface[50],
      tertiary: colors.surface[100],
      inverse: colors.surface[900],
    },

    // Border colors
    border: {
      primary: colors.surface[200],
      secondary: colors.surface[300],
      muted: colors.surface[100],
    },
  },

  dark: {
    // Text colors
    text: {
      primary: colors.white,
      secondary: colors.neutral[300],
      muted: colors.neutral[500], // PRD spec
      inverse: colors.surface[900],
    },

    // Background colors
    background: {
      primary: colors.surface[900], // PRD spec
      secondary: colors.surface[800],
      tertiary: colors.surface[700],
      inverse: colors.white,
    },

    // Border colors
    border: {
      primary: colors.surface[700],
      secondary: colors.surface[600],
      muted: colors.surface[800],
    },
  },
} as const;

// Export design tokens as a complete system
export const designTokens = {
  colors,
  typography,
  spacing,
  motion,
  radius,
  shadows,
  breakpoints,
  zIndex,
  components,
  semanticColors,
} as const;

export default designTokens;
