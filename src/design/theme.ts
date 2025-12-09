/**
 * Material-UI Theme Configuration with BeatFlowMedia Design Tokens
 * Integrates design tokens with Material-UI's theming system
 */

import { createTheme, ThemeOptions, Theme } from "@mui/material/styles";
import { designTokens } from "./tokens";
import { ThemeMode } from "./types";

// Extend Material-UI theme interface
declare module "@mui/material/styles" {
  interface Theme {
    designTokens: typeof designTokens;
  }

  interface ThemeOptions {
    designTokens?: typeof designTokens;
  }

  interface Palette {
    tertiary: Palette["primary"];
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
  }

  interface TypeText {
    muted: string;
  }

  interface TypographyVariants {
    display1: React.CSSProperties;
    display2: React.CSSProperties;
    display3: React.CSSProperties;
    caption2: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    display1?: React.CSSProperties;
    display2?: React.CSSProperties;
    display3?: React.CSSProperties;
    caption2?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    display1: true;
    display2: true;
    display3: true;
    caption2: true;
  }
}

// Create base theme configuration
const createBaseTheme = (mode: ThemeMode): ThemeOptions => {
  const isDark = mode === "dark";
  const colorScheme = isDark
    ? designTokens.semanticColors.dark
    : designTokens.semanticColors.light;

  return {
    // Add design tokens to theme
    designTokens,

    // Configure palette with design tokens
    palette: {
      mode,
      primary: {
        main: designTokens.colors.primary[500],
        light: designTokens.colors.primary[400],
        dark: designTokens.colors.primary[600],
        contrastText: designTokens.colors.white,
      },
      secondary: {
        main: designTokens.colors.neutral[500],
        light: designTokens.colors.neutral[400],
        dark: designTokens.colors.neutral[600],
        contrastText: isDark
          ? designTokens.colors.white
          : designTokens.colors.surface[900],
      },
      tertiary: {
        main: designTokens.colors.info[500],
        light: designTokens.colors.info[400],
        dark: designTokens.colors.info[600],
        contrastText: designTokens.colors.white,
      },
      error: {
        main: designTokens.colors.danger[500],
        light: designTokens.colors.danger[400],
        dark: designTokens.colors.danger[600],
        contrastText: designTokens.colors.white,
      },
      warning: {
        main: designTokens.colors.warning[500],
        light: designTokens.colors.warning[400],
        dark: designTokens.colors.warning[600],
        contrastText: designTokens.colors.surface[900],
      },
      info: {
        main: designTokens.colors.info[500],
        light: designTokens.colors.info[400],
        dark: designTokens.colors.info[600],
        contrastText: designTokens.colors.white,
      },
      success: {
        main: designTokens.colors.success[500],
        light: designTokens.colors.success[400],
        dark: designTokens.colors.success[600],
        contrastText: designTokens.colors.white,
      },
      grey: {
        50: designTokens.colors.neutral[50],
        100: designTokens.colors.neutral[100],
        200: designTokens.colors.neutral[200],
        300: designTokens.colors.neutral[300],
        400: designTokens.colors.neutral[400],
        500: designTokens.colors.neutral[500],
        600: designTokens.colors.neutral[600],
        700: designTokens.colors.neutral[700],
        800: designTokens.colors.neutral[800],
        900: designTokens.colors.neutral[900],
        A100: designTokens.colors.neutral[100],
        A200: designTokens.colors.neutral[200],
        A400: designTokens.colors.neutral[400],
        A700: designTokens.colors.neutral[700],
      },
      background: {
        default: colorScheme.background.primary,
        paper: colorScheme.background.secondary,
      },
      text: {
        primary: colorScheme.text.primary,
        secondary: colorScheme.text.secondary,
        muted: colorScheme.text.muted,
        disabled: isDark
          ? designTokens.colors.neutral[600]
          : designTokens.colors.neutral[400],
      },
      divider: colorScheme.border.primary,
      action: {
        active: colorScheme.text.primary,
        hover: isDark
          ? designTokens.colors.surface[800]
          : designTokens.colors.surface[100],
        selected: isDark
          ? designTokens.colors.surface[700]
          : designTokens.colors.surface[200],
        disabled: isDark
          ? designTokens.colors.neutral[600]
          : designTokens.colors.neutral[400],
        disabledBackground: isDark
          ? designTokens.colors.surface[800]
          : designTokens.colors.surface[100],
        focus: designTokens.colors.primary[500],
      },
    },

    // Typography configuration
    typography: {
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
      fontWeightLight: designTokens.typography.fontWeight.light,
      fontWeightRegular: designTokens.typography.fontWeight.normal,
      fontWeightMedium: designTokens.typography.fontWeight.medium,
      fontWeightBold: designTokens.typography.fontWeight.bold,

      // Responsive font sizes
      h1: {
        fontSize: designTokens.typography.fontSize["5xl"].desktop,
        fontWeight: designTokens.typography.fontWeight.bold,
        lineHeight: designTokens.typography.fontSize["5xl"].lineHeight,
        letterSpacing: designTokens.typography.letterSpacing.tight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize["5xl"].mobile,
        },
      },
      h2: {
        fontSize: designTokens.typography.fontSize["4xl"].desktop,
        fontWeight: designTokens.typography.fontWeight.bold,
        lineHeight: designTokens.typography.fontSize["4xl"].lineHeight,
        letterSpacing: designTokens.typography.letterSpacing.tight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize["4xl"].mobile,
        },
      },
      h3: {
        fontSize: designTokens.typography.fontSize["3xl"].desktop,
        fontWeight: designTokens.typography.fontWeight.semibold,
        lineHeight: designTokens.typography.fontSize["3xl"].lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize["3xl"].mobile,
        },
      },
      h4: {
        fontSize: designTokens.typography.fontSize["2xl"].desktop,
        fontWeight: designTokens.typography.fontWeight.semibold,
        lineHeight: designTokens.typography.fontSize["2xl"].lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize["2xl"].mobile,
        },
      },
      h5: {
        fontSize: designTokens.typography.fontSize.xl.desktop, // PRD spec
        fontWeight: designTokens.typography.fontWeight.medium,
        lineHeight: designTokens.typography.fontSize.xl.lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize.xl.mobile,
        },
      },
      h6: {
        fontSize: designTokens.typography.fontSize.lg.desktop,
        fontWeight: designTokens.typography.fontWeight.medium,
        lineHeight: designTokens.typography.fontSize.lg.lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize.lg.mobile,
        },
      },
      subtitle1: {
        fontSize: designTokens.typography.fontSize.base.desktop, // PRD spec
        fontWeight: designTokens.typography.fontWeight.medium,
        lineHeight: designTokens.typography.fontSize.base.lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize.base.mobile,
        },
      },
      subtitle2: {
        fontSize: designTokens.typography.fontSize.sm.desktop, // PRD spec
        fontWeight: designTokens.typography.fontWeight.medium,
        lineHeight: designTokens.typography.fontSize.sm.lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize.sm.mobile,
        },
      },
      body1: {
        fontSize: designTokens.typography.fontSize.base.desktop, // PRD spec
        fontWeight: designTokens.typography.fontWeight.normal,
        lineHeight: designTokens.typography.fontSize.base.lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize.base.mobile,
        },
      },
      body2: {
        fontSize: designTokens.typography.fontSize.sm.desktop, // PRD spec
        fontWeight: designTokens.typography.fontWeight.normal,
        lineHeight: designTokens.typography.fontSize.sm.lineHeight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize.sm.mobile,
        },
      },
      caption: {
        fontSize: designTokens.typography.fontSize.xs.desktop,
        fontWeight: designTokens.typography.fontWeight.normal,
        lineHeight: designTokens.typography.fontSize.xs.lineHeight,
        color: colorScheme.text.muted,
      },
      button: {
        fontSize: designTokens.typography.fontSize.sm.desktop,
        fontWeight: designTokens.typography.fontWeight.medium,
        textTransform: "none" as const,
        letterSpacing: designTokens.typography.letterSpacing.wide,
      },
      overline: {
        fontSize: designTokens.typography.fontSize.xs.desktop,
        fontWeight: designTokens.typography.fontWeight.semibold,
        textTransform: "uppercase" as const,
        letterSpacing: designTokens.typography.letterSpacing.widest,
        color: colorScheme.text.muted,
      },

      // Custom variants
      display1: {
        fontSize: designTokens.typography.fontSize["6xl"].desktop,
        fontWeight: designTokens.typography.fontWeight.black,
        lineHeight: designTokens.typography.fontSize["6xl"].lineHeight,
        letterSpacing: designTokens.typography.letterSpacing.tighter,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize["6xl"].mobile,
        },
      },
      display2: {
        fontSize: designTokens.typography.fontSize["5xl"].desktop,
        fontWeight: designTokens.typography.fontWeight.extrabold,
        lineHeight: designTokens.typography.fontSize["5xl"].lineHeight,
        letterSpacing: designTokens.typography.letterSpacing.tighter,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize["5xl"].mobile,
        },
      },
      display3: {
        fontSize: designTokens.typography.fontSize["4xl"].desktop,
        fontWeight: designTokens.typography.fontWeight.bold,
        lineHeight: designTokens.typography.fontSize["4xl"].lineHeight,
        letterSpacing: designTokens.typography.letterSpacing.tight,
        [`@media (max-width: ${designTokens.breakpoints.values.md}px)`]: {
          fontSize: designTokens.typography.fontSize["4xl"].mobile,
        },
      },
      caption2: {
        fontSize: "11px",
        fontWeight: designTokens.typography.fontWeight.normal,
        lineHeight: "14px",
        color: colorScheme.text.muted,
      },
    },

    // Spacing configuration
    spacing: (factor: number) => `${factor * 8}px`, // 8px base unit

    // Breakpoints (use design token values)
    breakpoints: {
      values: designTokens.breakpoints.values,
    },

    // Shape configuration (border radius)
    shape: {
      borderRadius: parseInt(designTokens.radius.md),
    },

    // Z-index configuration
    zIndex: {
      mobileStepper: designTokens.zIndex.sticky,
      fab: designTokens.zIndex.docked,
      speedDial: designTokens.zIndex.docked,
      appBar: designTokens.zIndex.sticky,
      drawer: designTokens.zIndex.overlay,
      modal: designTokens.zIndex.modal,
      snackbar: designTokens.zIndex.toast,
      tooltip: designTokens.zIndex.tooltip,
    },

    // Shadows (elevation)
    shadows: [
      "none",
      designTokens.shadows.xs,
      designTokens.shadows.sm,
      designTokens.shadows.sm,
      designTokens.shadows.md,
      designTokens.shadows.md,
      designTokens.shadows.md,
      designTokens.shadows.lg,
      designTokens.shadows.lg,
      designTokens.shadows.lg,
      designTokens.shadows.xl,
      designTokens.shadows.xl,
      designTokens.shadows.xl,
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
      designTokens.shadows["2xl"],
    ] as any,

    // Transitions
    transitions: {
      easing: {
        easeInOut: designTokens.motion.easing.easeInOut,
        easeOut: designTokens.motion.easing.easeOut,
        easeIn: designTokens.motion.easing.easeIn,
        sharp: designTokens.motion.easing.linear,
      },
      duration: {
        shortest: parseInt(designTokens.motion.duration.fast),
        shorter: parseInt(designTokens.motion.duration.fast),
        short: parseInt(designTokens.motion.duration.normal),
        standard: parseInt(designTokens.motion.duration.normal),
        complex: parseInt(designTokens.motion.duration.slow),
        enteringScreen: parseInt(designTokens.motion.duration.normal),
        leavingScreen: parseInt(designTokens.motion.duration.fast),
      },
    },
  };
};

// Create light theme
export const lightTheme = createTheme(createBaseTheme("light"));

// Create dark theme
export const darkTheme = createTheme(createBaseTheme("dark"));

// Theme customization with component overrides
const createCustomizedTheme = (baseTheme: Theme): Theme => {
  return createTheme(baseTheme, {
    components: {
      // Button customizations
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.button,
            textTransform: "none",
            fontWeight: designTokens.typography.fontWeight.medium,
            transition: `all ${designTokens.motion.duration.fast} ${designTokens.motion.easing.easeOut}`,
            "&:focus-visible": {
              outline: `2px solid ${designTokens.colors.primary[500]}`,
              outlineOffset: "2px",
            },
          },
          sizeSmall: {
            height: designTokens.components.button.height.sm,
            padding: designTokens.components.button.padding.sm,
            fontSize: designTokens.typography.fontSize.sm.desktop,
          },
          sizeMedium: {
            height: designTokens.components.button.height.md,
            padding: designTokens.components.button.padding.md,
            fontSize: designTokens.typography.fontSize.base.desktop,
          },
          sizeLarge: {
            height: designTokens.components.button.height.lg,
            padding: designTokens.components.button.padding.lg,
            fontSize: designTokens.typography.fontSize.lg.desktop,
          },
          contained: {
            boxShadow: designTokens.shadows.sm,
            "&:hover": {
              boxShadow: designTokens.shadows.md,
            },
            "&:active": {
              boxShadow: designTokens.shadows.xs,
            },
          },
        },
      },

      // Card customizations
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.card,
            boxShadow:
              baseTheme.palette.mode === "dark"
                ? designTokens.shadows.dark.sm
                : designTokens.shadows.sm,
            transition: `all ${designTokens.motion.duration.normal} ${designTokens.motion.easing.easeOut}`,
            "&:hover": {
              boxShadow:
                baseTheme.palette.mode === "dark"
                  ? designTokens.shadows.dark.md
                  : designTokens.shadows.md,
              transform: "translateY(-2px)",
            },
          },
        },
      },

      // Input customizations
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: designTokens.radius.input,
              transition: `all ${designTokens.motion.duration.fast} ${designTokens.motion.easing.easeOut}`,
              "&:focus-within": {
                boxShadow: `0 0 0 2px ${designTokens.colors.primary[500]}33`,
              },
            },
          },
        },
      },

      // Paper customizations
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.md,
          },
          elevation1: {
            boxShadow:
              baseTheme.palette.mode === "dark"
                ? designTokens.shadows.dark.xs
                : designTokens.shadows.xs,
          },
          elevation2: {
            boxShadow:
              baseTheme.palette.mode === "dark"
                ? designTokens.shadows.dark.sm
                : designTokens.shadows.sm,
          },
          elevation3: {
            boxShadow:
              baseTheme.palette.mode === "dark"
                ? designTokens.shadows.dark.md
                : designTokens.shadows.md,
          },
        },
      },

      // Chip customizations
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.full,
            fontWeight: designTokens.typography.fontWeight.medium,
          },
        },
      },

      // AppBar customizations
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow:
              baseTheme.palette.mode === "dark"
                ? designTokens.shadows.dark.sm
                : designTokens.shadows.sm,
          },
        },
      },

      // Dialog customizations
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: designTokens.radius.modal,
          },
        },
      },

      // Menu customizations
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: designTokens.radius.lg,
            boxShadow:
              baseTheme.palette.mode === "dark"
                ? designTokens.shadows.dark.lg
                : designTokens.shadows.lg,
          },
        },
      },

      // Tooltip customizations
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: designTokens.radius.sm,
            fontSize: designTokens.typography.fontSize.xs.desktop,
            fontWeight: designTokens.typography.fontWeight.medium,
          },
        },
      },

      // IconButton customizations
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.md,
            transition: `all ${designTokens.motion.duration.fast} ${designTokens.motion.easing.easeOut}`,
            "&:focus-visible": {
              outline: `2px solid ${designTokens.colors.primary[500]}`,
              outlineOffset: "2px",
            },
          },
        },
      },

      // Switch customizations
      MuiSwitch: {
        styleOverrides: {
          track: {
            borderRadius: designTokens.radius.full,
          },
          thumb: {
            borderRadius: designTokens.radius.full,
          },
        },
      },

      // Slider customizations
      MuiSlider: {
        styleOverrides: {
          track: {
            borderRadius: designTokens.radius.full,
          },
          rail: {
            borderRadius: designTokens.radius.full,
          },
          thumb: {
            borderRadius: designTokens.radius.full,
            transition: `all ${designTokens.motion.duration.fast} ${designTokens.motion.easing.easeOut}`,
            "&:hover": {
              boxShadow: designTokens.shadows.colored.primary,
            },
          },
        },
      },
    },
  });
};

// Export customized themes
export const customLightTheme = createCustomizedTheme(lightTheme);
export const customDarkTheme = createCustomizedTheme(darkTheme);

// Helper function to get theme by mode
export const getTheme = (mode: ThemeMode): Theme => {
  return mode === "dark" ? customDarkTheme : customLightTheme;
};

export default getTheme;
