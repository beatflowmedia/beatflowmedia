// src/components/A11yHelpers.js
import React, { useEffect, useRef } from "react";

/**
 * A11yHelpers - Accessibility utility components and hooks for WCAG 2.1 AA compliance
 */

/**
 * SkipLink - Skip navigation link for keyboard users
 */
export const SkipLink = ({
  href = "#main-content",
  children = "Skip to main content"
}) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
  >
    {children}
  </a>
);

/**
 * ScreenReaderOnly - Hide content visually but keep it available for screen readers
 */
export const ScreenReaderOnly = ({ children, as: Component = "span" }) => (
  <Component className="sr-only">{children}</Component>
);

/**
 * LiveRegion - Announce dynamic content changes to screen readers
 */
export const LiveRegion = ({
  children,
  assertive = false,
  atomic = false,
  id = "live-region"
}) => (
  <div
    id={id}
    aria-live={assertive ? "assertive" : "polite"}
    aria-atomic={atomic}
    className="sr-only"
  >
    {children}
  </div>
);

/**
 * FocusTrap - Trap focus within a container (for modals, dropdowns)
 */
export const FocusTrap = ({ children, active = true, restoreFocus = true }) => {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    // Get focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
    };

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    // Focus first element
    const firstFocusable = getFocusableElements()[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      container.removeEventListener("keydown", handleKeyDown);

      // Restore focus
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return <div ref={containerRef}>{children}</div>;
};

/**
 * useReducedMotion - Hook to detect user's motion preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * useHighContrast - Hook to detect high contrast mode
 */
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setIsHighContrast(mediaQuery.matches);

    const handler = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isHighContrast;
};

/**
 * useKeyboardNavigation - Hook for keyboard navigation helpers
 */
export const useKeyboardNavigation = (containerRef, options = {}) => {
  const {
    orientation = "both", // 'horizontal', 'vertical', 'both'
    wrap = true,
    selector = '[role="button"], button, [tabindex]:not([tabindex="-1"])'
  } = options;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      const focusableElements = Array.from(
        container.querySelectorAll(selector),
      );
      const currentIndex = focusableElements.indexOf(document.activeElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowLeft":
          if (orientation === "horizontal" || orientation === "both") {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0 && wrap) {
              nextIndex = focusableElements.length - 1;
            }
          }
          break;
        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "both") {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length && wrap) {
              nextIndex = 0;
            }
          }
          break;
        case "ArrowUp":
          if (orientation === "vertical" || orientation === "both") {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0 && wrap) {
              nextIndex = focusableElements.length - 1;
            }
          }
          break;
        case "ArrowDown":
          if (orientation === "vertical" || orientation === "both") {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length && wrap) {
              nextIndex = 0;
            }
          }
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex >= 0 && nextIndex < focusableElements.length) {
        focusableElements[nextIndex]?.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, orientation, wrap, selector]);
};

/**
 * A11yButton - Accessible button component with proper keyboard handling
 */
export const A11yButton = React.forwardRef(
  (
    {
      children,
      onClick,
      disabled = false,
      ariaLabel,
      ariaPressed,
      ariaExpanded,
      className = "",
      variant = "button", // 'button' or 'link'
      ...props
    },
    ref,
  ) => {
    const handleKeyDown = (e) => {
      // Handle Enter and Space for button activation
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault();
        onClick?.(e);
      }
    };

    const baseClasses =
      "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    if (variant === "link") {
      return (
        <span
          ref={ref}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-pressed={ariaPressed}
          aria-expanded={ariaExpanded}
          aria-disabled={disabled}
          className={`${baseClasses} ${className}`}
          onClick={disabled ? undefined : onClick}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        className={`${baseClasses} ${className}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </button>
    );
  },
);

A11yButton.displayName = "A11yButton";

/**
 * A11yHeading - Semantic heading component with proper hierarchy
 */
export const A11yHeading = ({
  level = 1,
  children,
  className = "",
  id,
  ...props
}) => {
  const Component = `h${Math.max(1, Math.min(6, level))}`;

  return (
    <Component id={id} className={className} {...props}>
      {children}
    </Component>
  );
};

/**
 * A11yList - Accessible list component with proper ARIA attributes
 */
export const A11yList = ({
  children,
  ordered = false,
  className = "",
  ariaLabel,
  ariaLabelledBy,
  ...props
}) => {
  const Component = ordered ? "ol" : "ul";

  return (
    <Component
      role="list"
      className={className}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * A11yListItem - Accessible list item component
 */
export const A11yListItem = ({ children, className = "", ...props }) => (
  <li role="listitem" className={className} {...props}>
    {children}
  </li>
);

/**
 * A11yDialog - Accessible dialog/modal component
 */
export const A11yDialog = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  titleId = "dialog-title",
  contentId = "dialog-content"
}) => {
  const dialogRef = useRef(null);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={contentId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <FocusTrap active={isOpen}>
        <div
          ref={dialogRef}
          className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
        >
          {title && (
            <h2 id={titleId} className="text-lg font-semibold p-6 pb-2">
              {title}
            </h2>
          )}

          <div id={contentId} className="p-6">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

/**
 * announceToScreenReader - Utility function to announce content to screen readers
 */
export const announceToScreenReader = (message, priority = "polite") => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * getContrastRatio - Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((val) => {
      const sRGB = parseInt(val) / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * isContrastCompliant - Check if contrast ratio meets WCAG guidelines
 */
export const isContrastCompliant = (
  color1,
  color2,
  level = "AA",
  size = "normal",
) => {
  const ratio = getContrastRatio(color1, color2);
  const threshold =
    level === "AAA" ? (size === "large" ? 4.5 : 7) : size === "large" ? 3 : 4.5;
  return ratio >= threshold;
};
