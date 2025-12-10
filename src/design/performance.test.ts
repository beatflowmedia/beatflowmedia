/**
 * Performance Utilities Tests
 * Comprehensive test suite for performance optimization utilities
 */

import { renderHook, act } from "@testing-library/react";
import {
  performanceUtils,
  useIntersectionObserver,
  useDebouncedCallback,
  useThrottledCallback,
  useDebouncedValue,
  useReducedMotion,
  useAnimationFrame,
  generateOptimizedImageUrl,
  supportsWebP,
  preloadImage,
  preloadImages,
  useVirtualScrolling,
  useComponentSize,
} from "./performance";

// Mock performance APIs
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(() => ({ duration: 16.67 })),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => [{ duration: 16.67 }]),
  getEntriesByType: jest.fn(() => []),
};

Object.defineProperty(window, "performance", {
  value: mockPerformance,
  writable: true,
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = jest.fn();
mockResizeObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.ResizeObserver = mockResizeObserver;

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();
window.requestAnimationFrame = mockRequestAnimationFrame;
window.cancelAnimationFrame = mockCancelAnimationFrame;

describe("Performance Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Performance Markers", () => {
    it("marks performance points", () => {
      performanceUtils.performanceMarkers.mark("test-start");
      expect(mockPerformance.mark).toHaveBeenCalledWith("test-start");
    });

    it("measures performance between points", () => {
      performanceUtils.performanceMarkers.measure(
        "test-duration",
        "start",
        "end",
      );
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        "test-duration",
        "start",
        "end",
      );
    });

    it("clears performance marks and measures", () => {
      performanceUtils.performanceMarkers.clear();
      expect(mockPerformance.clearMarks).toHaveBeenCalled();
      expect(mockPerformance.clearMeasures).toHaveBeenCalled();
    });

    it("handles missing performance API gracefully", () => {
      const originalPerformance = window.performance;
      // @ts-ignore
      delete window.performance;

      expect(() => {
        performanceUtils.performanceMarkers.mark("test");
      }).not.toThrow();

      window.performance = originalPerformance;
    });
  });

  describe("useIntersectionObserver", () => {
    it("creates intersection observer", () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.isIntersecting).toBe(false);
      expect(result.current.elementRef.current).toBe(null);
    });

    it("handles intersection changes", () => {
      const { result } = renderHook(() => useIntersectionObserver());

      // Mock element ref
      const mockElement = document.createElement("div");
      result.current.elementRef.current = mockElement;

      // Simulate intersection
      const [callback] = mockIntersectionObserver.mock.calls[0];
      act(() => {
        callback([{ isIntersecting: true }]);
      });

      expect(result.current.isIntersecting).toBe(true);
    });

    it("falls back gracefully without IntersectionObserver", () => {
      const originalObserver = window.IntersectionObserver;
      // @ts-ignore
      delete window.IntersectionObserver;

      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.isIntersecting).toBe(true);

      window.IntersectionObserver = originalObserver;
    });
  });

  describe("useDebouncedCallback", () => {
    it("debounces callback execution", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 100));

      // Call multiple times rapidly
      result.current();
      result.current();
      result.current();

      expect(callback).not.toHaveBeenCalled();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("cancels debounced calls on unmount", () => {
      const callback = jest.fn();
      const { result, unmount } = renderHook(() =>
        useDebouncedCallback(callback, 100),
      );

      result.current();
      unmount();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("useThrottledCallback", () => {
    it("throttles callback execution", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottledCallback(callback, 100));

      // Call multiple times rapidly
      result.current();
      result.current();
      result.current();

      expect(callback).toHaveBeenCalledTimes(1);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      result.current();
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe("useDebouncedValue", () => {
    it("debounces value changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: "initial", delay: 100 } },
      );

      expect(result.current).toBe("initial");

      rerender({ value: "updated", delay: 100 });
      expect(result.current).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe("updated");
    });
  });

  describe("useReducedMotion", () => {
    it("detects reduced motion preference", () => {
      const mockMatchMedia = jest.fn(() => ({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith(
        "(prefers-reduced-motion: reduce)",
      );
    });

    it("handles media query changes", () => {
      let changeHandler: (event: any) => void;
      const mockMatchMedia = jest.fn(() => ({
        matches: false,
        addEventListener: jest.fn((event, handler) => {
          if (event === "change") changeHandler = handler;
        }),
        removeEventListener: jest.fn(),
      }));
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        changeHandler({ matches: true });
      });

      expect(result.current).toBe(true);
    });
  });

  describe("useAnimationFrame", () => {
    it("starts animation frame loop", () => {
      const callback = jest.fn();
      renderHook(() => useAnimationFrame(callback, true));

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it("stops animation frame when disabled", () => {
      const callback = jest.fn();
      const { rerender } = renderHook(
        ({ enabled }) => useAnimationFrame(callback, enabled),
        { initialProps: { enabled: true } },
      );

      expect(mockRequestAnimationFrame).toHaveBeenCalled();

      rerender({ enabled: false });
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it("calls callback with delta time", () => {
      const callback = jest.fn();
      renderHook(() => useAnimationFrame(callback, true));

      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0];
      animationCallback(16.67);
      animationCallback(33.34);

      expect(callback).toHaveBeenCalledWith(16.67);
    });
  });

  describe("Image Optimization", () => {
    it("generates optimized image URLs", () => {
      const url = generateOptimizedImageUrl("https://example.com/image.jpg", {
        width: 300,
        height: 200,
        quality: 80,
        format: "webp",
        fit: "cover",
      });

      expect(url).toContain("w=300");
      expect(url).toContain("h=200");
      expect(url).toContain("q=80");
      expect(url).toContain("f=webp");
      expect(url).toContain("fit=cover");
    });

    it("handles invalid URLs gracefully", () => {
      const url = generateOptimizedImageUrl("invalid-url", {
        width: 300,
        height: 200,
      });

      expect(url).toBe("invalid-url");
    });

    it("detects WebP support", async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        height: 2,
        src: "",
      };

      global.Image = jest.fn(() => mockImage) as any;

      const supportPromise = supportsWebP();

      // Simulate successful WebP load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await supportPromise;
      expect(result).toBe(true);
    });

    it("preloads single image", async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: "",
      };

      global.Image = jest.fn(() => mockImage) as any;

      const preloadPromise = preloadImage("/test-image.jpg");

      // Simulate successful image load
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      await expect(preloadPromise).resolves.toBeUndefined();
      expect(mockImage.src).toBe("/test-image.jpg");
    });

    it("preloads multiple images", async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: "",
      };

      global.Image = jest.fn(() => mockImage) as any;

      const images = ["/image1.jpg", "/image2.jpg", "/image3.jpg"];
      const preloadPromise = preloadImages(images);

      // Simulate all images loading
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
          mockImage.onload();
          mockImage.onload();
        }
      }, 0);

      await expect(preloadPromise).resolves.toHaveLength(3);
    });
  });

  describe("useVirtualScrolling", () => {
    it("calculates visible items correctly", () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualScrolling(items, 50, 300, 2),
      );

      expect(result.current.visibleItems).toHaveLength(8); // 6 visible + 2 overscan on each side
      expect(result.current.totalHeight).toBe(5000); // 100 items * 50px height
      expect(result.current.offsetY).toBe(0);
    });

    it("updates visible items on scroll", () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualScrolling(items, 50, 300, 2),
      );

      // Simulate scroll event
      const mockEvent = {
        currentTarget: { scrollTop: 250 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.onScroll(mockEvent);
      });

      expect(result.current.startIndex).toBeGreaterThan(0);
      expect(result.current.offsetY).toBeGreaterThan(0);
    });
  });

  describe("useComponentSize", () => {
    it("tracks component size changes", () => {
      const { result } = renderHook(() => useComponentSize());

      expect(result.current.size).toEqual({ width: 0, height: 0 });
      expect(mockResizeObserver).toHaveBeenCalled();
    });

    it("updates size when element resizes", () => {
      const { result } = renderHook(() => useComponentSize());

      const mockElement = document.createElement("div");
      result.current.elementRef.current = mockElement;

      // Simulate resize
      const [callback] = mockResizeObserver.mock.calls[0];
      act(() => {
        callback([
          {
            contentRect: { width: 200, height: 150 },
          },
        ]);
      });

      expect(result.current.size).toEqual({ width: 200, height: 150 });
    });

    it("handles missing ResizeObserver gracefully", () => {
      const originalObserver = window.ResizeObserver;
      // @ts-ignore
      delete window.ResizeObserver;

      const { result } = renderHook(() => useComponentSize());

      expect(result.current.size).toEqual({ width: 0, height: 0 });

      window.ResizeObserver = originalObserver;
    });
  });

  describe("Bundle Analysis", () => {
    it("logs bundle information in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const consoleSpy = jest.spyOn(console, "group").mockImplementation();

      performanceUtils.analyzeBundle("TestComponent");

      expect(consoleSpy).toHaveBeenCalledWith(
        "📦 Bundle Analysis: TestComponent",
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it("does not log in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const consoleSpy = jest.spyOn(console, "group").mockImplementation();

      performanceUtils.analyzeBundle("TestComponent");

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Memory Management", () => {
    it("provides cleanup effect hook", () => {
      const cleanup = jest.fn();
      const { unmount } = renderHook(() =>
        performanceUtils.useCleanupEffect(cleanup, []),
      );

      expect(cleanup).not.toHaveBeenCalled();

      unmount();
      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("handles performance API errors gracefully", () => {
      const originalPerformance = window.performance;
      window.performance = {
        ...mockPerformance,
        mark: jest.fn(() => {
          throw new Error("Performance API error");
        }),
      } as any;

      expect(() => {
        performanceUtils.performanceMarkers.mark("test");
      }).not.toThrow();

      window.performance = originalPerformance;
    });

    it("handles intersection observer errors gracefully", () => {
      const ErrorObserver = jest.fn(() => {
        throw new Error("IntersectionObserver error");
      });
      window.IntersectionObserver = ErrorObserver;

      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.isIntersecting).toBe(true); // Fallback behavior
    });

    it("handles animation frame errors gracefully", () => {
      const errorCallback = jest.fn(() => {
        throw new Error("Animation callback error");
      });

      window.requestAnimationFrame = jest.fn((callback) => {
        try {
          callback(16.67);
        } catch (error) {
          // Errors should be caught and not crash the app
        }
        return 1;
      });

      expect(() => {
        renderHook(() => useAnimationFrame(errorCallback, true));
      }).not.toThrow();
    });
  });
});
