/**
 * BeatFlowMedia Design System
 * Main entry point for the design system
 */

// Design tokens
export {
  designTokens,
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
} from "./tokens";

// TypeScript types
export type * from "./types";

// Theme and provider
export {
  default as getTheme,
  lightTheme,
  darkTheme,
  customLightTheme,
  customDarkTheme,
} from "./theme";
export {
  default as DesignSystemProvider,
  useDesignSystem,
  useThemeTokens,
  useBreakpoints,
  useMotion,
} from "./ThemeProvider";

// Utilities
export { default as designSystemUtils } from "./utils";

// Accessibility
export { default as accessibility } from "./accessibility";

// Components
export * from "./components/atoms";

// Design system version and metadata
export const VERSION = "1.0.0";
export const BUILD_DATE = new Date().toISOString();
export const DESIGN_SYSTEM_NAME = "BeatFlowMedia Design System";

// Feature flags
export const FEATURES = {
  DARK_MODE: true,
  RESPONSIVE_TYPOGRAPHY: true,
  ACCESSIBILITY_ENHANCEMENTS: true,
  MOTION_PREFERENCES: true,
  HIGH_CONTRAST_SUPPORT: true,
  TOUCH_FRIENDLY: true,
  STORYBOOK_INTEGRATION: true,
} as const;
