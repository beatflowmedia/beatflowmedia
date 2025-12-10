/**
 * TypeScript type definitions for BeatFlowMedia Design System
 * Provides type safety and IntelliSense for design tokens
 */

import { designTokens } from "./tokens";

// Color types
export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

export type ColorPalette = typeof designTokens.colors;
export type ColorToken = keyof ColorPalette;
export type ColorShade = keyof ColorScale;

// Typography types
export type FontFamily = keyof typeof designTokens.typography.fontFamily;
export type FontWeight = keyof typeof designTokens.typography.fontWeight;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type LineHeight = keyof typeof designTokens.typography.lineHeight;
export type LetterSpacing = keyof typeof designTokens.typography.letterSpacing;

export type FontSizeConfig = {
  mobile: string;
  desktop: string;
  lineHeight: string;
};

// Spacing types
export type SpacingToken = keyof typeof designTokens.spacing;
export type ComponentSpacing = keyof typeof designTokens.spacing.component;
export type LayoutSpacing = keyof typeof designTokens.spacing.layout;
export type ContainerSpacing = keyof typeof designTokens.spacing.container;

// Motion types
export type MotionDuration = keyof typeof designTokens.motion.duration;
export type MotionEasing = keyof typeof designTokens.motion.easing;
export type SpringConfig =
  (typeof designTokens.motion.spring)[keyof typeof designTokens.motion.spring];

// Border radius types
export type RadiusToken = keyof typeof designTokens.radius;

// Shadow types
export type ShadowToken = keyof typeof designTokens.shadows;
export type DarkShadowToken = keyof typeof designTokens.shadows.dark;
export type ColoredShadowToken = keyof typeof designTokens.shadows.colored;

// Breakpoint types
export type BreakpointToken = keyof typeof designTokens.breakpoints.values;

// Z-index types
export type ZIndexToken = keyof typeof designTokens.zIndex;

// Component types
export type ButtonSize = keyof typeof designTokens.components.button.height;
export type InputSize = keyof typeof designTokens.components.input.height;
export type CardSize = keyof typeof designTokens.components.card.padding;

// Theme types
export type ThemeMode = "light" | "dark";
export type SemanticColorCategory =
  keyof typeof designTokens.semanticColors.light;
export type SemanticColorToken =
  keyof typeof designTokens.semanticColors.light.text;

// Utility types for CSS properties
export type CSSValue = string | number;
export type ResponsiveValue<T> = T | Partial<Record<BreakpointToken, T>>;

// Design system configuration
export interface DesignSystemConfig {
  mode: ThemeMode;
  colorMode: "light" | "dark" | "auto";
  reducedMotion: boolean;
  highContrast: boolean;
}

// Component variant types
export type ComponentVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "outline";
export type ComponentSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ComponentState =
  | "default"
  | "hover"
  | "focus"
  | "active"
  | "disabled"
  | "loading";

// Theme context types
export interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  tokens: typeof designTokens;
  config: DesignSystemConfig;
  updateConfig: (config: Partial<DesignSystemConfig>) => void;
}

// CSS-in-JS utility types
export interface StyleProps {
  // Spacing
  m?: ResponsiveValue<SpacingToken>;
  mt?: ResponsiveValue<SpacingToken>;
  mr?: ResponsiveValue<SpacingToken>;
  mb?: ResponsiveValue<SpacingToken>;
  ml?: ResponsiveValue<SpacingToken>;
  mx?: ResponsiveValue<SpacingToken>;
  my?: ResponsiveValue<SpacingToken>;
  p?: ResponsiveValue<SpacingToken>;
  pt?: ResponsiveValue<SpacingToken>;
  pr?: ResponsiveValue<SpacingToken>;
  pb?: ResponsiveValue<SpacingToken>;
  pl?: ResponsiveValue<SpacingToken>;
  px?: ResponsiveValue<SpacingToken>;
  py?: ResponsiveValue<SpacingToken>;

  // Colors
  color?: ResponsiveValue<string>;
  backgroundColor?: ResponsiveValue<string>;
  borderColor?: ResponsiveValue<string>;

  // Typography
  fontSize?: ResponsiveValue<FontSize>;
  fontWeight?: ResponsiveValue<FontWeight>;
  lineHeight?: ResponsiveValue<LineHeight>;
  letterSpacing?: ResponsiveValue<LetterSpacing>;
  textAlign?: ResponsiveValue<"left" | "center" | "right" | "justify">;

  // Layout
  display?: ResponsiveValue<
    | "block"
    | "inline"
    | "inline-block"
    | "flex"
    | "inline-flex"
    | "grid"
    | "none"
  >;
  width?: ResponsiveValue<CSSValue>;
  height?: ResponsiveValue<CSSValue>;
  maxWidth?: ResponsiveValue<CSSValue>;
  maxHeight?: ResponsiveValue<CSSValue>;
  minWidth?: ResponsiveValue<CSSValue>;
  minHeight?: ResponsiveValue<CSSValue>;

  // Flexbox
  alignItems?: ResponsiveValue<
    "flex-start" | "flex-end" | "center" | "baseline" | "stretch"
  >;
  justifyContent?: ResponsiveValue<
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
  >;
  flexDirection?: ResponsiveValue<
    "row" | "row-reverse" | "column" | "column-reverse"
  >;
  flexWrap?: ResponsiveValue<"nowrap" | "wrap" | "wrap-reverse">;
  gap?: ResponsiveValue<SpacingToken>;

  // Position
  position?: ResponsiveValue<
    "static" | "relative" | "absolute" | "fixed" | "sticky"
  >;
  top?: ResponsiveValue<CSSValue>;
  right?: ResponsiveValue<CSSValue>;
  bottom?: ResponsiveValue<CSSValue>;
  left?: ResponsiveValue<CSSValue>;
  zIndex?: ResponsiveValue<ZIndexToken>;

  // Border
  borderRadius?: ResponsiveValue<RadiusToken>;
  borderWidth?: ResponsiveValue<CSSValue>;
  borderStyle?: ResponsiveValue<"solid" | "dashed" | "dotted" | "none">;

  // Shadow
  boxShadow?: ResponsiveValue<ShadowToken>;
}

// Animation and transition types
export interface AnimationConfig {
  duration: MotionDuration;
  easing: MotionEasing;
  delay?: MotionDuration;
  fillMode?: "none" | "forwards" | "backwards" | "both";
  iterationCount?: number | "infinite";
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}

export interface TransitionConfig {
  property: string | string[];
  duration: MotionDuration;
  easing: MotionEasing;
  delay?: MotionDuration;
}

// Accessibility types
export interface AccessibilityProps {
  // ARIA attributes
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-hidden"?: boolean;
  "aria-pressed"?: boolean;
  "aria-selected"?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-disabled"?: boolean;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
  "aria-atomic"?: boolean;
  "aria-busy"?: boolean;
  "aria-controls"?: string;
  "aria-owns"?: string;
  "aria-haspopup"?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";

  // Focus management
  tabIndex?: number;
  autoFocus?: boolean;

  // Keyboard navigation
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;

  // Screen reader
  role?: string;
  title?: string;
}

// Component prop types with design system integration
export interface BaseComponentProps extends StyleProps, AccessibilityProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  as?: React.ElementType;
  variant?: ComponentVariant;
  size?: ComponentSize;
  disabled?: boolean;
  loading?: boolean;
}

// Styled component types for CSS-in-JS
export interface StyledComponentProps extends BaseComponentProps {
  theme: typeof designTokens;
  $variant?: ComponentVariant;
  $size?: ComponentSize;
  $state?: ComponentState;
}

// Media query helper types
export type MediaQueryFunction = (breakpoint: BreakpointToken) => string;
export type MediaQueryHelpers = {
  up: MediaQueryFunction;
  down: MediaQueryFunction;
  between: (min: BreakpointToken, max: BreakpointToken) => string;
  only: MediaQueryFunction;
};

// Grid system types
export interface GridProps {
  container?: boolean;
  item?: boolean;
  columns?: ResponsiveValue<number>;
  columnSpan?: ResponsiveValue<number>;
  rowSpan?: ResponsiveValue<number>;
  gap?: ResponsiveValue<SpacingToken>;
  columnGap?: ResponsiveValue<SpacingToken>;
  rowGap?: ResponsiveValue<SpacingToken>;
}

// Form component types
export interface FormComponentProps extends BaseComponentProps {
  name?: string;
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
}

// Layout component types
export interface LayoutProps extends BaseComponentProps {
  maxWidth?: ResponsiveValue<CSSValue>;
  centerContent?: boolean;
  fullHeight?: boolean;
  padding?: ResponsiveValue<SpacingToken>;
  margin?: ResponsiveValue<SpacingToken>;
}

// Navigation component types
export interface NavigationProps extends BaseComponentProps {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "pills" | "underline";
  spacing?: SpacingToken;
}

// Data display component types
export interface DataDisplayProps extends BaseComponentProps {
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  pagination?: boolean;
  density?: "compact" | "standard" | "comfortable";
}

// Overlay component types
export interface OverlayProps extends BaseComponentProps {
  open?: boolean;
  onClose?: () => void;
  backdrop?: boolean;
  backdropDismiss?: boolean;
  escapeKeyDismiss?: boolean;
  focusTrap?: boolean;
  restoreFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
}

// Export all types
export type {
  // Re-export design token types
  ColorScale,
  ColorPalette,
  ColorToken,
  ColorShade,
  FontSizeConfig,
  SpringConfig,
};

// Design system hook types
export interface UseDesignSystemReturn {
  tokens: typeof designTokens;
  mode: ThemeMode;
  config: DesignSystemConfig;
  helpers: {
    getColor: (token: string, shade?: ColorShade) => string;
    getSpacing: (token: SpacingToken) => string;
    getFontSize: (token: FontSize, breakpoint?: BreakpointToken) => string;
    getBreakpoint: MediaQueryHelpers;
    formatResponsiveValue: <T>(
      value: ResponsiveValue<T>,
      breakpoint: BreakpointToken,
    ) => T;
  };
}

// Storybook integration types
export interface StorybookDesignTokensAddon {
  tokens: typeof designTokens;
  categories: {
    colors: Record<string, any>;
    typography: Record<string, any>;
    spacing: Record<string, any>;
    motion: Record<string, any>;
    shadows: Record<string, any>;
  };
}

// =============================================================================
// ATOMIC COMPONENT SPECIFIC TYPES
// =============================================================================

// Icon types
export type IconName =
  // Playback controls
  | "play"
  | "pause"
  | "stop"
  | "next"
  | "previous"
  | "forward"
  | "backward"
  | "fast-forward"
  | "fast-backward"
  | "repeat"
  | "repeat-one"
  | "shuffle"
  | "replay"

  // Volume controls
  | "volume-up"
  | "volume-down"
  | "volume-mute"
  | "volume-off"
  | "volume-low"
  | "volume-medium"
  | "volume-high"

  // Interactive elements
  | "heart"
  | "heart-filled"
  | "like"
  | "liked"
  | "favorite"
  | "favorite-filled"
  | "plus"
  | "minus"
  | "add"
  | "remove"

  // Music elements
  | "music"
  | "music-note"
  | "album"
  | "disc"
  | "vinyl"
  | "headphones"
  | "microphone"
  | "radio"
  | "podcast"
  | "waveform"
  | "equalizer"
  | "high-quality"

  // Playlist and library
  | "playlist"
  | "playlist-add"
  | "playlist-play"
  | "queue"
  | "library"
  | "folder"
  | "folder-open"

  // Navigation and layout
  | "menu"
  | "menu-vertical"
  | "more"
  | "more-vertical"
  | "dots"
  | "dots-vertical"
  | "list"
  | "grid"
  | "expand"
  | "minimize"
  | "fullscreen"
  | "exit-fullscreen"

  // Actions
  | "download"
  | "share"
  | "search"
  | "filter"
  | "settings"
  | "edit"

  // User and social
  | "user"
  | "users"
  | "profile"

  // Status and indicators
  | "online"
  | "offline"
  | "live"
  | "recording"
  | "streaming"
  | "trending"
  | "new"
  | "featured"
  | "verified"

  // Time and scheduling
  | "clock"
  | "calendar"
  | "schedule"
  | "history"
  | "recent"

  // Categories and genres
  | "tag"
  | "genre"
  | "mood"
  | "explore"
  | "discover"

  // Rating and feedback
  | "star"
  | "star-filled"
  | "rating"

  // Brand specific
  | "spotify"
  | "beatflow";

export type IconVariant =
  | "filled"
  | "outlined"
  | "rounded"
  | "sharp"
  | "two-tone";

// Button specific types
export interface MusicButtonProps {
  isPlaying?: boolean;
  isLiked?: boolean;
  pulse?: boolean;
  glow?: boolean;
}

// Input validation types
export interface InputValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: string) => string | null;
}

export interface InputAutocomplete {
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  filterSuggestions?: boolean;
}

// Image optimization types
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "auto";
  fit?: "cover" | "contain" | "fill";
  progressive?: boolean;
  blur?: number;
}

// Avatar status types
export type AvatarStatus =
  | "online"
  | "offline"
  | "away"
  | "busy"
  | "streaming"
  | "recording"
  | "listening";
export type AvatarVariant = "circular" | "rounded" | "square";

// =============================================================================
// PERFORMANCE AND OPTIMIZATION TYPES
// =============================================================================

export interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  bundleSize?: number;
  memoryUsage?: number;
}

export interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export interface VirtualScrollingConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  direction?: "vertical" | "horizontal";
}

// =============================================================================
// MUSIC STREAMING SPECIFIC TYPES
// =============================================================================

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork?: string;
  isLiked?: boolean;
  isExplicit?: boolean;
  genre?: string;
  releaseDate?: string;
}

export interface MusicArtist {
  id: string;
  name: string;
  avatar?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  followerCount?: number;
  monthlyListeners?: number;
}

export interface MusicPlaylist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  trackCount: number;
  duration: number;
  isPublic: boolean;
  owner: MusicArtist;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack?: MusicTrack;
  position: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: "none" | "track" | "playlist";
  shuffleEnabled: boolean;
  queue: MusicTrack[];
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface UseThemeTokensReturn {
  colors: typeof designTokens.colors;
  typography: typeof designTokens.typography;
  spacing: typeof designTokens.spacing;
  motion: typeof designTokens.motion;
  radius: typeof designTokens.radius;
  shadows: typeof designTokens.shadows;
  breakpoints: typeof designTokens.breakpoints;
  zIndex: typeof designTokens.zIndex;
  components: typeof designTokens.components;
}

export interface UseBreakpointsReturn {
  current: BreakpointToken;
  matches: Record<BreakpointToken, boolean>;
  up: (breakpoint: BreakpointToken) => boolean;
  down: (breakpoint: BreakpointToken) => boolean;
  only: (breakpoint: BreakpointToken) => boolean;
  between: (start: BreakpointToken, end: BreakpointToken) => boolean;
}

export interface UseMotionReturn {
  prefersReducedMotion: boolean;
  duration: typeof designTokens.motion.duration;
  easing: typeof designTokens.motion.easing;
  spring: typeof designTokens.motion.spring;
}

// =============================================================================
// UTILITY AND HELPER TYPES
// =============================================================================

// Component ref types
export type ComponentRef<T> = React.Ref<T>;

// Event handler types
export type ClickHandler<T = HTMLElement> = (
  event: React.MouseEvent<T>,
) => void;
export type FocusHandler<T = HTMLElement> = (
  event: React.FocusEvent<T>,
) => void;
export type ChangeHandler<T = HTMLInputElement> = (
  event: React.ChangeEvent<T>,
) => void;
export type KeyboardHandler<T = HTMLElement> = (
  event: React.KeyboardEvent<T>,
) => void;

// Component polymorphic types
export type PolymorphicComponentProps<E extends React.ElementType, P = {}> = P &
  Omit<React.ComponentPropsWithoutRef<E>, keyof P> & {
    as?: E;
  };

export type PolymorphicRef<E extends React.ElementType> =
  React.ComponentPropsWithRef<E>["ref"];

// Component forwarded ref types
export type ForwardedRef<T, P = {}> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<T>
>;

// =============================================================================
// VALIDATION AND FORM TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule<T = any> {
  name: string;
  message: string;
  validator: (value: T) => boolean;
}

export interface FormValidation {
  rules: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showInlineErrors?: boolean;
}

// =============================================================================
// THEME EXTENSION TYPES
// =============================================================================

declare module "@mui/material/styles" {
  interface Theme {
    designTokens: typeof designTokens;
  }

  interface ThemeOptions {
    designTokens?: typeof designTokens;
  }
}

// =============================================================================
// EXPORT ENHANCED TYPES
// =============================================================================

export type {
  // Enhanced icon types
  IconName,
  IconVariant,

  // Enhanced component types
  MusicButtonProps,
  InputValidation,
  InputAutocomplete,
  ImageOptimizationOptions,
  AvatarStatus,
  AvatarVariant,

  // Performance types
  PerformanceMetrics,
  LazyLoadingOptions,
  VirtualScrollingConfig,

  // Music streaming types
  MusicTrack,
  MusicArtist,
  MusicPlaylist,
  PlaybackState,

  // Enhanced hook types
  UseThemeTokensReturn,
  UseBreakpointsReturn,
  UseMotionReturn,

  // Utility types
  ComponentRef,
  ClickHandler,
  FocusHandler,
  ChangeHandler,
  KeyboardHandler,
  PolymorphicComponentProps,
  PolymorphicRef,
  ForwardedRef,

  // Validation types
  ValidationResult,
  ValidationRule,
  FormValidation,
};
