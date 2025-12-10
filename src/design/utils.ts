/**
 * Design System Utilities
 * Helper functions for working with design tokens and responsive values
 */

import { css, SerializedStyles } from "@emotion/react";
import { designTokens } from "./tokens";
import {
  ResponsiveValue,
  BreakpointToken,
  SpacingToken,
  FontSize,
  ColorShade,
  StyleProps,
  ThemeMode,
} from "./types";

// Get color value with optional shade
export const getColor = (
  colorPath: string,
  shade?: ColorShade | number,
): string => {
  const pathParts = colorPath.split(".");
  let value: any = designTokens.colors;

  for (const part of pathParts) {
    value = value?.[part];
    if (value === undefined) {
      console.warn(`Color path "${colorPath}" not found in design tokens`);
      return "#000000"; // fallback
    }
  }

  if (shade !== undefined) {
    if (typeof value === "object" && value[shade]) {
      return value[shade];
    }
    console.warn(`Shade "${shade}" not found for color "${colorPath}"`);
  }

  return typeof value === "string" ? value : value[500] || "#000000";
};

// Get spacing value
export const getSpacing = (token: SpacingToken): string => {
  return designTokens.spacing[token] || "0px";
};

// Get font size with optional breakpoint
export const getFontSize = (
  token: FontSize,
  breakpoint: "mobile" | "desktop" = "desktop",
): string => {
  const fontSize = designTokens.typography.fontSize[token];
  return fontSize?.[breakpoint] || fontSize?.desktop || "16px";
};

// Generate media query
export const mediaQuery = (breakpoint: BreakpointToken): string => {
  return `@media (min-width: ${designTokens.breakpoints.values[breakpoint]}px)`;
};

// Generate responsive CSS
export const responsive = <T>(
  value: ResponsiveValue<T>,
  transformer?: (val: T) => string | SerializedStyles,
): SerializedStyles => {
  if (typeof value !== "object" || value === null) {
    const transformedValue = transformer
      ? transformer(value as T)
      : String(value);
    return css`
      ${transformedValue}
    `;
  }

  const breakpointEntries = Object.entries(value as Record<string, T>);
  const sortedBreakpoints = breakpointEntries.sort(([a], [b]) => {
    const aValue = designTokens.breakpoints.values[a as BreakpointToken] || 0;
    const bValue = designTokens.breakpoints.values[b as BreakpointToken] || 0;
    return aValue - bValue;
  });

  return css`
    ${sortedBreakpoints.map(([breakpoint, val]) => {
      const transformedValue = transformer ? transformer(val) : String(val);
      if (
        breakpoint === "xs" ||
        designTokens.breakpoints.values[breakpoint as BreakpointToken] === 0
      ) {
        return transformedValue;
      }
      return css`
        ${mediaQuery(breakpoint as BreakpointToken)} {
          ${transformedValue}
        }
      `;
    })}
  `;
};

// Spacing utilities
export const spacing = {
  margin: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `margin: ${getSpacing(val)};`),

  marginTop: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `margin-top: ${getSpacing(val)};`),

  marginRight: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `margin-right: ${getSpacing(val)};`),

  marginBottom: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `margin-bottom: ${getSpacing(val)};`),

  marginLeft: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `margin-left: ${getSpacing(val)};`),

  marginX: (value: ResponsiveValue<SpacingToken>) =>
    responsive(
      value,
      (val) =>
        `margin-left: ${getSpacing(val)}; margin-right: ${getSpacing(val)};`,
    ),

  marginY: (value: ResponsiveValue<SpacingToken>) =>
    responsive(
      value,
      (val) =>
        `margin-top: ${getSpacing(val)}; margin-bottom: ${getSpacing(val)};`,
    ),

  padding: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `padding: ${getSpacing(val)};`),

  paddingTop: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `padding-top: ${getSpacing(val)};`),

  paddingRight: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `padding-right: ${getSpacing(val)};`),

  paddingBottom: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `padding-bottom: ${getSpacing(val)};`),

  paddingLeft: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `padding-left: ${getSpacing(val)};`),

  paddingX: (value: ResponsiveValue<SpacingToken>) =>
    responsive(
      value,
      (val) =>
        `padding-left: ${getSpacing(val)}; padding-right: ${getSpacing(val)};`,
    ),

  paddingY: (value: ResponsiveValue<SpacingToken>) =>
    responsive(
      value,
      (val) =>
        `padding-top: ${getSpacing(val)}; padding-bottom: ${getSpacing(val)};`,
    ),
};

// Typography utilities
export const typography = {
  fontSize: (value: ResponsiveValue<FontSize>) =>
    responsive(value, (val) => `font-size: ${getFontSize(val)};`),

  fontWeight: (
    value: ResponsiveValue<keyof typeof designTokens.typography.fontWeight>,
  ) =>
    responsive(
      value,
      (val) => `font-weight: ${designTokens.typography.fontWeight[val]};`,
    ),

  lineHeight: (
    value: ResponsiveValue<keyof typeof designTokens.typography.lineHeight>,
  ) =>
    responsive(
      value,
      (val) => `line-height: ${designTokens.typography.lineHeight[val]};`,
    ),

  letterSpacing: (
    value: ResponsiveValue<keyof typeof designTokens.typography.letterSpacing>,
  ) =>
    responsive(
      value,
      (val) => `letter-spacing: ${designTokens.typography.letterSpacing[val]};`,
    ),

  textAlign: (
    value: ResponsiveValue<"left" | "center" | "right" | "justify">,
  ) => responsive(value, (val) => `text-align: ${val};`),

  fontFamily: (family: keyof typeof designTokens.typography.fontFamily) => css`
    font-family: ${designTokens.typography.fontFamily[family].join(", ")};
  `,
};

// Layout utilities
export const layout = {
  display: (
    value: ResponsiveValue<
      | "block"
      | "inline"
      | "inline-block"
      | "flex"
      | "inline-flex"
      | "grid"
      | "none"
    >,
  ) => responsive(value, (val) => `display: ${val};`),

  width: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `width: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  height: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `height: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  maxWidth: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `max-width: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  maxHeight: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `max-height: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  minWidth: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `min-width: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  minHeight: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `min-height: ${typeof val === "number" ? `${val}px` : val};`,
    ),
};

// Flexbox utilities
export const flexbox = {
  alignItems: (
    value: ResponsiveValue<
      "flex-start" | "flex-end" | "center" | "baseline" | "stretch"
    >,
  ) => responsive(value, (val) => `align-items: ${val};`),

  justifyContent: (
    value: ResponsiveValue<
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "space-evenly"
    >,
  ) => responsive(value, (val) => `justify-content: ${val};`),

  flexDirection: (
    value: ResponsiveValue<"row" | "row-reverse" | "column" | "column-reverse">,
  ) => responsive(value, (val) => `flex-direction: ${val};`),

  flexWrap: (value: ResponsiveValue<"nowrap" | "wrap" | "wrap-reverse">) =>
    responsive(value, (val) => `flex-wrap: ${val};`),

  gap: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `gap: ${getSpacing(val)};`),

  columnGap: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `column-gap: ${getSpacing(val)};`),

  rowGap: (value: ResponsiveValue<SpacingToken>) =>
    responsive(value, (val) => `row-gap: ${getSpacing(val)};`),
};

// Position utilities
export const position = {
  position: (
    value: ResponsiveValue<
      "static" | "relative" | "absolute" | "fixed" | "sticky"
    >,
  ) => responsive(value, (val) => `position: ${val};`),

  top: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `top: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  right: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `right: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  bottom: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `bottom: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  left: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `left: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  zIndex: (value: ResponsiveValue<keyof typeof designTokens.zIndex>) =>
    responsive(value, (val) => `z-index: ${designTokens.zIndex[val]};`),
};

// Color utilities
export const colors = {
  color: (colorPath: string, shade?: ColorShade) => css`
    color: ${getColor(colorPath, shade)};
  `,

  backgroundColor: (colorPath: string, shade?: ColorShade) => css`
    background-color: ${getColor(colorPath, shade)};
  `,

  borderColor: (colorPath: string, shade?: ColorShade) => css`
    border-color: ${getColor(colorPath, shade)};
  `,
};

// Border utilities
export const border = {
  borderRadius: (value: ResponsiveValue<keyof typeof designTokens.radius>) =>
    responsive(value, (val) => `border-radius: ${designTokens.radius[val]};`),

  borderWidth: (value: ResponsiveValue<string | number>) =>
    responsive(
      value,
      (val) => `border-width: ${typeof val === "number" ? `${val}px` : val};`,
    ),

  borderStyle: (
    value: ResponsiveValue<"solid" | "dashed" | "dotted" | "none">,
  ) => responsive(value, (val) => `border-style: ${val};`),
};

// Shadow utilities
export const shadow = {
  boxShadow: (
    value: ResponsiveValue<keyof typeof designTokens.shadows>,
    mode?: ThemeMode,
  ) =>
    responsive(value, (val) => {
      const shadows =
        mode === "dark" ? designTokens.shadows.dark : designTokens.shadows;
      return `box-shadow: ${shadows[val as keyof typeof shadows] || designTokens.shadows[val]};`;
    }),

  textShadow: (value: string) => css`
    text-shadow: ${value};
  `,
};

// Animation utilities
export const animation = {
  transition: (
    property: string | string[],
    duration: keyof typeof designTokens.motion.duration = "normal",
    easing: keyof typeof designTokens.motion.easing = "easeOut",
    delay?: keyof typeof designTokens.motion.duration,
  ) => {
    const properties = Array.isArray(property) ? property.join(", ") : property;
    const delayValue = delay ? designTokens.motion.duration[delay] : "0ms";

    return css`
      transition: ${properties} ${designTokens.motion.duration[duration]}
        ${designTokens.motion.easing[easing]} ${delayValue};
    `;
  },

  duration: (duration: keyof typeof designTokens.motion.duration) => css`
    animation-duration: ${designTokens.motion.duration[duration]};
  `,

  easing: (easing: keyof typeof designTokens.motion.easing) => css`
    animation-timing-function: ${designTokens.motion.easing[easing]};
  `,

  transform: (value: string) => css`
    transform: ${value};
  `,

  transformOrigin: (value: string) => css`
    transform-origin: ${value};
  `,
};

// Container utilities
export const container = {
  maxWidth: (breakpoint: BreakpointToken = "xl") => css`
    max-width: ${designTokens.breakpoints.values[breakpoint]}px;
    margin-left: auto;
    margin-right: auto;
    padding-left: ${designTokens.spacing.container.sm};
    padding-right: ${designTokens.spacing.container.sm};

    ${mediaQuery("sm")} {
      padding-left: ${designTokens.spacing.container.md};
      padding-right: ${designTokens.spacing.container.md};
    }

    ${mediaQuery("lg")} {
      padding-left: ${designTokens.spacing.container.lg};
      padding-right: ${designTokens.spacing.container.lg};
    }
  `,

  fluid: () => css`
    width: 100%;
    padding-left: ${designTokens.spacing.container.sm};
    padding-right: ${designTokens.spacing.container.sm};

    ${mediaQuery("sm")} {
      padding-left: ${designTokens.spacing.container.md};
      padding-right: ${designTokens.spacing.container.md};
    }

    ${mediaQuery("lg")} {
      padding-left: ${designTokens.spacing.container.lg};
      padding-right: ${designTokens.spacing.container.lg};
    }
  `,
};

// Grid utilities
export const grid = {
  container: (gap?: SpacingToken) => css`
    display: grid;
    ${gap && `gap: ${getSpacing(gap)};`}
  `,

  columns: (value: ResponsiveValue<number>) =>
    responsive(value, (val) => `grid-template-columns: repeat(${val}, 1fr);`),

  rows: (value: ResponsiveValue<number>) =>
    responsive(value, (val) => `grid-template-rows: repeat(${val}, 1fr);`),

  span: (columns: number, rows?: number) => css`
    grid-column: span ${columns};
    ${rows && `grid-row: span ${rows};`}
  `,

  area: (value: string) => css`
    grid-area: ${value};
  `,

  template: (value: string) => css`
    grid-template-areas: ${value};
  `,
};

// Utility function to parse style props
export const parseStyleProps = (props: StyleProps): SerializedStyles => {
  const styles: SerializedStyles[] = [];

  // Spacing
  if (props.m) styles.push(spacing.margin(props.m));
  if (props.mt) styles.push(spacing.marginTop(props.mt));
  if (props.mr) styles.push(spacing.marginRight(props.mr));
  if (props.mb) styles.push(spacing.marginBottom(props.mb));
  if (props.ml) styles.push(spacing.marginLeft(props.ml));
  if (props.mx) styles.push(spacing.marginX(props.mx));
  if (props.my) styles.push(spacing.marginY(props.my));
  if (props.p) styles.push(spacing.padding(props.p));
  if (props.pt) styles.push(spacing.paddingTop(props.pt));
  if (props.pr) styles.push(spacing.paddingRight(props.pr));
  if (props.pb) styles.push(spacing.paddingBottom(props.pb));
  if (props.pl) styles.push(spacing.paddingLeft(props.pl));
  if (props.px) styles.push(spacing.paddingX(props.px));
  if (props.py) styles.push(spacing.paddingY(props.py));

  // Colors
  if (props.color)
    styles.push(css`
      color: ${props.color};
    `);
  if (props.backgroundColor)
    styles.push(css`
      background-color: ${props.backgroundColor};
    `);
  if (props.borderColor)
    styles.push(css`
      border-color: ${props.borderColor};
    `);

  // Typography
  if (props.fontSize) styles.push(typography.fontSize(props.fontSize));
  if (props.fontWeight) styles.push(typography.fontWeight(props.fontWeight));
  if (props.lineHeight) styles.push(typography.lineHeight(props.lineHeight));
  if (props.letterSpacing)
    styles.push(typography.letterSpacing(props.letterSpacing));
  if (props.textAlign) styles.push(typography.textAlign(props.textAlign));

  // Layout
  if (props.display) styles.push(layout.display(props.display));
  if (props.width) styles.push(layout.width(props.width));
  if (props.height) styles.push(layout.height(props.height));
  if (props.maxWidth) styles.push(layout.maxWidth(props.maxWidth));
  if (props.maxHeight) styles.push(layout.maxHeight(props.maxHeight));
  if (props.minWidth) styles.push(layout.minWidth(props.minWidth));
  if (props.minHeight) styles.push(layout.minHeight(props.minHeight));

  // Flexbox
  if (props.alignItems) styles.push(flexbox.alignItems(props.alignItems));
  if (props.justifyContent)
    styles.push(flexbox.justifyContent(props.justifyContent));
  if (props.flexDirection)
    styles.push(flexbox.flexDirection(props.flexDirection));
  if (props.flexWrap) styles.push(flexbox.flexWrap(props.flexWrap));
  if (props.gap) styles.push(flexbox.gap(props.gap));

  // Position
  if (props.position) styles.push(position.position(props.position));
  if (props.top) styles.push(position.top(props.top));
  if (props.right) styles.push(position.right(props.right));
  if (props.bottom) styles.push(position.bottom(props.bottom));
  if (props.left) styles.push(position.left(props.left));
  if (props.zIndex) styles.push(position.zIndex(props.zIndex));

  // Border
  if (props.borderRadius) styles.push(border.borderRadius(props.borderRadius));
  if (props.borderWidth) styles.push(border.borderWidth(props.borderWidth));
  if (props.borderStyle) styles.push(border.borderStyle(props.borderStyle));

  // Shadow
  if (props.boxShadow) styles.push(shadow.boxShadow(props.boxShadow));

  return css`
    ${styles}
  `;
};

// Export all utilities
export const designSystemUtils = {
  getColor,
  getSpacing,
  getFontSize,
  mediaQuery,
  responsive,
  spacing,
  typography,
  layout,
  flexbox,
  position,
  colors,
  border,
  shadow,
  animation,
  container,
  grid,
  parseStyleProps,
};

export default designSystemUtils;
