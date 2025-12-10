/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant helpers and utilities
 */

import { designTokens } from "./tokens";

// WCAG Color contrast utilities
export const colorContrast = {
  // Minimum contrast ratios for WCAG 2.1 AA compliance
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,

  // Calculate relative luminance
  getLuminance: (color: string): number => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const [rs, gs, bs] = [r, g, b].map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = colorContrast.getLuminance(color1);
    const lum2 = colorContrast.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsAA: (
    foreground: string,
    background: string,
    isLarge: boolean = false,
  ): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    const threshold = isLarge
      ? colorContrast.AA_LARGE
      : colorContrast.AA_NORMAL;
    return ratio >= threshold;
  },

  meetsAAA: (
    foreground: string,
    background: string,
    isLarge: boolean = false,
  ): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    const threshold = isLarge
      ? colorContrast.AAA_LARGE
      : colorContrast.AAA_NORMAL;
    return ratio >= threshold;
  },

  // Get accessible text color for background
  getAccessibleTextColor: (backgroundColor: string): string => {
    const whiteContrast = colorContrast.getContrastRatio(
      "#ffffff",
      backgroundColor,
    );
    const blackContrast = colorContrast.getContrastRatio(
      "#000000",
      backgroundColor,
    );

    return whiteContrast > blackContrast ? "#ffffff" : "#000000";
  },
};

// Focus management utilities
export const focusManagement = {
  // Trap focus within an element
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  },

  // Restore focus to previous element
  createFocusRestore: () => {
    const previousElement = document.activeElement as HTMLElement;

    return () => {
      if (previousElement && typeof previousElement.focus === "function") {
        previousElement.focus();
      }
    };
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    if (element.tabIndex < 0) return false;
    if (element.hasAttribute("disabled")) return false;
    if (element.getAttribute("aria-disabled") === "true") return false;

    const tagName = element.tagName.toLowerCase();
    const focusableTags = ["input", "select", "textarea", "button", "a"];

    if (focusableTags.includes(tagName)) {
      return true;
    }

    return element.tabIndex >= 0;
  },
};

// Screen reader utilities
export const screenReader = {
  // Announce message to screen readers
  announce: (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.style.position = "absolute";
    announcement.style.left = "-10000px";
    announcement.style.width = "1px";
    announcement.style.height = "1px";
    announcement.style.overflow = "hidden";

    document.body.appendChild(announcement);
    announcement.textContent = message;

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Create visually hidden element for screen readers
  createVisuallyHidden: (text: string): HTMLElement => {
    const element = document.createElement("span");
    element.textContent = text;
    element.style.position = "absolute";
    element.style.left = "-10000px";
    element.style.width = "1px";
    element.style.height = "1px";
    element.style.overflow = "hidden";
    element.setAttribute("aria-hidden", "false");
    return element;
  },

  // Generate unique IDs for accessibility
  generateId: (prefix: string = "a11y"): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation for lists
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      loop?: boolean;
      orientation?: "horizontal" | "vertical" | "both";
    } = {},
  ): number => {
    const { loop = true, orientation = "vertical" } = options;
    let newIndex = currentIndex;

    const isHorizontal = orientation === "horizontal" || orientation === "both";
    const isVertical = orientation === "vertical" || orientation === "both";

    switch (event.key) {
      case "ArrowDown":
        if (isVertical) {
          newIndex = currentIndex + 1;
          if (newIndex >= items.length) {
            newIndex = loop ? 0 : items.length - 1;
          }
          event.preventDefault();
        }
        break;

      case "ArrowUp":
        if (isVertical) {
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? items.length - 1 : 0;
          }
          event.preventDefault();
        }
        break;

      case "ArrowRight":
        if (isHorizontal) {
          newIndex = currentIndex + 1;
          if (newIndex >= items.length) {
            newIndex = loop ? 0 : items.length - 1;
          }
          event.preventDefault();
        }
        break;

      case "ArrowLeft":
        if (isHorizontal) {
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? items.length - 1 : 0;
          }
          event.preventDefault();
        }
        break;

      case "Home":
        newIndex = 0;
        event.preventDefault();
        break;

      case "End":
        newIndex = items.length - 1;
        event.preventDefault();
        break;
    }

    return newIndex;
  },

  // Common keyboard event handlers
  createKeyboardHandler: (handlers: Record<string, () => void>) => {
    return (event: KeyboardEvent) => {
      const handler = handlers[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
  },
};

// Touch accessibility utilities
export const touchAccessibility = {
  // Minimum touch target size (44px for WCAG AA)
  MIN_TOUCH_TARGET: 44,

  // Check if element meets minimum touch target size
  meetsTouchTarget: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.width >= touchAccessibility.MIN_TOUCH_TARGET &&
      rect.height >= touchAccessibility.MIN_TOUCH_TARGET
    );
  },

  // Add touch-friendly spacing
  addTouchSpacing: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const minSize = touchAccessibility.MIN_TOUCH_TARGET;

    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
      element.style.display = "inline-flex";
      element.style.alignItems = "center";
      element.style.justifyContent = "center";
    }
  },
};

// Reduced motion utilities
export const reducedMotion = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  // Get duration based on motion preference
  getDuration: (
    normalDuration: string,
    reducedDuration: string = "0ms",
  ): string => {
    return reducedMotion.prefersReducedMotion()
      ? reducedDuration
      : normalDuration;
  },

  // Create motion-aware styles
  createMotionStyles: (normalStyles: any, reducedStyles: any = {}) => {
    return {
      ...normalStyles,
      "@media (prefers-reduced-motion: reduce)": {
        ...reducedStyles,
        animation: "none",
        transition: "none",
      },
    };
  },
};

// High contrast utilities
export const highContrast = {
  // Check if user prefers high contrast
  prefersHighContrast: (): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-contrast: high)").matches;
  },

  // Get high contrast styles
  getHighContrastStyles: () => ({
    "@media (prefers-contrast: high)": {
      border: "2px solid currentColor",
      outline: "1px solid currentColor",
    },
  }),
};

// ARIA utilities
export const aria = {
  // Common ARIA attributes
  attributes: {
    // Live regions
    livePolite: { "aria-live": "polite" as const },
    liveAssertive: { "aria-live": "assertive" as const },

    // States
    expanded: (isExpanded: boolean) => ({ "aria-expanded": isExpanded }),
    pressed: (isPressed: boolean) => ({ "aria-pressed": isPressed }),
    selected: (isSelected: boolean) => ({ "aria-selected": isSelected }),
    checked: (isChecked: boolean | "mixed") => ({ "aria-checked": isChecked }),
    disabled: (isDisabled: boolean) => ({ "aria-disabled": isDisabled }),
    hidden: (isHidden: boolean) => ({ "aria-hidden": isHidden }),
    busy: (isBusy: boolean) => ({ "aria-busy": isBusy }),

    // Properties
    label: (label: string) => ({ "aria-label": label }),
    labelledBy: (id: string) => ({ "aria-labelledby": id }),
    describedBy: (id: string) => ({ "aria-describedby": id }),
    controls: (id: string) => ({ "aria-controls": id }),
    owns: (id: string) => ({ "aria-owns": id }),

    // Roles
    button: { role: "button" as const },
    link: { role: "link" as const },
    tab: { role: "tab" as const },
    tabpanel: { role: "tabpanel" as const },
    menu: { role: "menu" as const },
    menuitem: { role: "menuitem" as const },
    dialog: { role: "dialog" as const },
    alert: { role: "alert" as const },
    status: { role: "status" as const },
  },

  // Build ARIA attributes object
  build: (attributes: Record<string, any>) => {
    return Object.entries(attributes).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  },
};

// Validate accessibility compliance
export const validateA11y = {
  // Check color contrast
  checkColorContrast: (
    foreground: string,
    background: string,
    level: "AA" | "AAA" = "AA",
    isLarge: boolean = false,
  ) => {
    const meetsStandard =
      level === "AA"
        ? colorContrast.meetsAA(foreground, background, isLarge)
        : colorContrast.meetsAAA(foreground, background, isLarge);

    return {
      passes: meetsStandard,
      ratio: colorContrast.getContrastRatio(foreground, background),
      level,
      isLarge,
    };
  },

  // Check touch targets
  checkTouchTargets: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const meetsTouchTarget = touchAccessibility.meetsTouchTarget(element);

    return {
      passes: meetsTouchTarget,
      width: rect.width,
      height: rect.height,
      minSize: touchAccessibility.MIN_TOUCH_TARGET,
    };
  },

  // Check focus indicators
  checkFocusIndicators: (element: HTMLElement) => {
    const computedStyle = getComputedStyle(element, ":focus");
    const outline = computedStyle.outline;
    const boxShadow = computedStyle.boxShadow;

    return {
      passes: outline !== "none" || boxShadow !== "none",
      outline,
      boxShadow,
    };
  },
};

// Export all accessibility utilities
export const accessibility = {
  colorContrast,
  focusManagement,
  screenReader,
  keyboardNavigation,
  touchAccessibility,
  reducedMotion,
  highContrast,
  aria,
  validateA11y,
};

export default accessibility;
