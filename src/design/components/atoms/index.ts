/**
 * Atoms - Basic building blocks of the design system
 * Export all atomic components with performance optimizations
 */

// Base components
export { default as Button, type ButtonProps } from "./Button";
export { default as Card, type CardProps } from "./Card";
export { default as Input, type InputProps } from "./Input";
export { default as Icon, type IconProps, type IconName } from "./Icon";
export { default as Image, type ImageProps } from "./Image";
export { default as Avatar, type AvatarProps } from "./Avatar";

// Performance-optimized components
export {
  Button as OptimizedButton,
  Icon as OptimizedIcon,
  Input as OptimizedInput,
  Image as OptimizedImage,
  Avatar as OptimizedAvatar,
  LazyComponents,
  performanceMetrics,
} from "./optimized";

// Re-export design system utilities for convenience
export { designSystemUtils } from "../../utils";
export { performanceUtils } from "../../performance";
export {
  useDesignSystem,
  useThemeTokens,
  useBreakpoints,
  useMotion,
} from "../../ThemeProvider";
export type {
  ComponentVariant,
  ComponentSize,
  AccessibilityProps,
} from "../../types";

// Export all types for better TypeScript support
export type {
  // Icon types
  IconName,

  // Component prop types
  ButtonProps,
  CardProps,
  InputProps,
  IconProps,
  ImageProps,
  AvatarProps,

  // Design system types
  ComponentVariant,
  ComponentSize,
  AccessibilityProps,
};
