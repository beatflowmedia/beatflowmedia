/**
 * Performance Optimization Utilities
 * Tools and utilities for optimizing component performance and bundle size
 */

import React, { useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { debounce, throttle } from 'lodash-es';

// Performance monitoring utilities
export const performanceMarkers = {
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof window !== 'undefined' && window.performance?.measure) {
      window.performance.measure(name, startMark, endMark);
      const measurement = window.performance.getEntriesByName(name)[0] as PerformanceMeasure;
      return measurement?.duration || 0;
    }
    return 0;
  },

  clear: () => {
    if (typeof window !== 'undefined' && window.performance?.clearMarks) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  },
};

// Memory-efficient memoization utilities
export const createMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

export const createMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

// Component optimization HOCs
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const PerformanceMonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    const startTime = useMemo(() => {
      performanceMarkers.mark(`${componentName}-render-start`);
      return Date.now();
    }, []);

    React.useEffect(() => {
      performanceMarkers.mark(`${componentName}-render-end`);
      const duration = performanceMarkers.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );

      if (duration > 16.67) { // More than one frame at 60fps
        console.warn(`${componentName} took ${duration.toFixed(2)}ms to render`);
      }
    });

    return <Component ref={ref} {...props} />;
  });

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return PerformanceMonitoredComponent;
};

// Efficient memo wrapper with shallow comparison
export const memoComponent = <P extends object>(
  Component: React.ComponentType<P>,
  customCompare?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, customCompare);
};

// Deep comparison for complex props
export const createDeepCompareCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const depsRef = React.useRef<React.DependencyList>();
  const callbackRef = React.useRef<T>();

  const hasChanged = !depsRef.current ||
    deps.length !== depsRef.current.length ||
    deps.some((dep, index) => {
      const prevDep = depsRef.current![index];
      return JSON.stringify(dep) !== JSON.stringify(prevDep);
    });

  if (hasChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return callbackRef.current!;
};

// Intersection Observer for lazy loading optimization
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(null);
  const elementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);

        // Disconnect after first intersection for lazy loading
        if (entry.isIntersecting && options.rootMargin?.includes('50px')) {
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]);

  return { isIntersecting, entry, elementRef };
};

// Debounced and throttled hooks
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const debouncedFn = useMemo(
    () => debounce(callback, delay),
    [...deps, delay]
  );

  React.useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  return debouncedFn as T;
};

export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const throttledFn = useMemo(
    () => throttle(callback, delay),
    [...deps, delay]
  );

  React.useEffect(() => {
    return () => {
      throttledFn.cancel();
    };
  }, [throttledFn]);

  return throttledFn as T;
};

export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Bundle splitting utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = lazy(importFn);

  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <Suspense fallback={fallback ? <fallback /> : <div>Loading...</div>}>
      <LazyComponent ref={ref} {...props} />
    </Suspense>
  ));
};

// Image optimization utilities
export const generateOptimizedImageUrl = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png' | 'auto';
    fit?: 'cover' | 'contain' | 'fill';
  } = {}
): string => {
  // This would integrate with a CDN service like Cloudinary, ImageKit, etc.
  // For now, return the original URL with basic optimization hints
  if (!src) return '';

  try {
    const url = new URL(src);
    const { width, height, quality = 80, format = 'auto', fit = 'cover' } = options;

    // Add optimization parameters
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', format);
    url.searchParams.set('fit', fit);

    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return src;
  }
};

// WebP support detection
export const supportsWebP = (() => {
  let support: boolean | null = null;

  return (): Promise<boolean> => {
    if (support !== null) {
      return Promise.resolve(support);
    }

    if (typeof window === 'undefined') {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        support = webP.height === 2;
        resolve(support);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };
})();

// Resource preloading utilities
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = (sources: string[]): Promise<void[]> => {
  return Promise.all(sources.map(preloadImage));
};

// Virtual scrolling utilities for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
    startIndex,
    endIndex,
  };
};

// Component size monitoring
export const useComponentSize = () => {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const elementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { size, elementRef };
};

// CSS-in-JS optimization utilities
export const createStableClassName = (baseClass: string, props: Record<string, any>): string => {
  const propKeys = Object.keys(props).sort();
  const hash = propKeys.reduce((acc, key) => {
    return acc + key + String(props[key]);
  }, '');

  // Simple hash function for stable class names
  let hashValue = 0;
  for (let i = 0; i < hash.length; i++) {
    const char = hash.charCodeAt(i);
    hashValue = ((hashValue << 5) - hashValue) + char;
    hashValue = hashValue & hashValue; // Convert to 32-bit integer
  }

  return `${baseClass}-${Math.abs(hashValue).toString(36)}`;
};

// Animation performance utilities
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// Request animation frame utilities
export const useAnimationFrame = (callback: (deltaTime: number) => void, enabled = true) => {
  const requestRef = React.useRef<number>();
  const previousTimeRef = React.useRef<number>();

  const animate = React.useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [callback, enabled]);

  React.useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, enabled]);
};

// Bundle analysis utilities (for development)
export const analyzeBundle = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`📦 Bundle Analysis: ${componentName}`);
    console.log('Component loaded at:', new Date().toISOString());
    console.log('Bundle chunk:', `${componentName.toLowerCase()}.chunk.js`);
    console.groupEnd();
  }
};

// Memory leak prevention
export const useCleanupEffect = (cleanup: () => void, deps: React.DependencyList) => {
  React.useEffect(() => {
    return cleanup;
  }, deps);
};

// Export all performance utilities
export const performanceUtils = {
  performanceMarkers,
  createMemoizedCallback,
  createMemoizedValue,
  withPerformanceMonitoring,
  memoComponent,
  createDeepCompareCallback,
  useIntersectionObserver,
  useDebouncedCallback,
  useThrottledCallback,
  useDebouncedValue,
  createLazyComponent,
  generateOptimizedImageUrl,
  supportsWebP,
  preloadImage,
  preloadImages,
  useVirtualScrolling,
  useComponentSize,
  createStableClassName,
  useReducedMotion,
  useAnimationFrame,
  analyzeBundle,
  useCleanupEffect,
};

export default performanceUtils;