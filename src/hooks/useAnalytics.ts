/**
 * Analytics Hook for React Components
 * Provides easy integration with analytics service throughout the app
 */

import { useContext, useEffect, useRef, useCallback } from "react";
import { AnalyticsService } from "../services/analytics/AnalyticsService";
import {
  ANALYTICS_EVENTS,
  PlaybackEvent,
  UserEngagementEvent,
} from "../services/analytics/AnalyticsConfig";

// Global analytics service instance
let analyticsServiceInstance: AnalyticsService | null = null;

/**
 * Initialize global analytics service
 */
export const initializeAnalytics = (userId?: string) => {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService({
      enabled: true,
      bufferSize: 50,
      flushInterval: 30000,
      enableRoyaltyCalculation: true,
      enablePerformanceMonitoring: true,
      enableSecurityTracking: true,
    });
  }

  analyticsServiceInstance.initialize(userId);
  return analyticsServiceInstance;
};

/**
 * Get global analytics service
 */
export const getAnalyticsService = (): AnalyticsService | null => {
  return analyticsServiceInstance;
};

/**
 * Analytics hook for React components
 */
export const useAnalytics = () => {
  const service = useRef<AnalyticsService | null>(analyticsServiceInstance);

  useEffect(() => {
    // Initialize service if not already done
    if (!service.current) {
      service.current = initializeAnalytics();
    }

    return () => {
      // Cleanup is handled globally, not per component
    };
  }, []);

  /**
   * Track playback events
   */
  const trackPlayback = useCallback(
    async (
      eventType: keyof typeof ANALYTICS_EVENTS,
      data: Partial<PlaybackEvent>,
    ) => {
      if (!service.current) return false;
      return await service.current.trackPlayback(eventType, data);
    },
    [],
  );

  /**
   * Track user engagement events
   */
  const trackEngagement = useCallback(
    async (
      eventType: keyof typeof ANALYTICS_EVENTS,
      data: Partial<UserEngagementEvent>,
    ) => {
      if (!service.current) return false;
      return await service.current.trackEngagement(eventType, data);
    },
    [],
  );

  /**
   * Track custom events
   */
  const trackCustom = useCallback(
    async (eventType: string, data: Record<string, any>) => {
      if (!service.current) return false;
      return await service.current.trackCustom(eventType, data);
    },
    [],
  );

  /**
   * Track page view
   */
  const trackPageView = useCallback(
    async (page: string, title?: string, metadata?: Record<string, any>) => {
      return await trackCustom("page_view", {
        page,
        title,
        url: window.location.href,
        referrer: document.referrer,
        ...metadata,
      });
    },
    [trackCustom],
  );

  /**
   * Track button click
   */
  const trackClick = useCallback(
    async (
      element: string,
      location: string,
      metadata?: Record<string, any>,
    ) => {
      return await trackCustom("button_click", {
        element,
        location,
        timestamp: Date.now(),
        ...metadata,
      });
    },
    [trackCustom],
  );

  /**
   * Track form submission
   */
  const trackFormSubmit = useCallback(
    async (
      formName: string,
      success: boolean,
      metadata?: Record<string, any>,
    ) => {
      return await trackCustom("form_submit", {
        formName,
        success,
        timestamp: Date.now(),
        ...metadata,
      });
    },
    [trackCustom],
  );

  /**
   * Track search
   */
  const trackSearch = useCallback(
    async (query: string, results: number, filters?: Record<string, any>) => {
      return await trackEngagement(ANALYTICS_EVENTS.SEARCH_QUERY, {
        action: "search",
        metadata: {
          query,
          results,
          filters,
        },
      });
    },
    [trackEngagement],
  );

  /**
   * Track media play
   */
  const trackPlay = useCallback(
    async (
      trackId: string,
      artistId?: string,
      position: number = 0,
      metadata?: Record<string, any>,
    ) => {
      return await trackPlayback(ANALYTICS_EVENTS.PLAY_START, {
        trackId,
        artistId,
        position,
        quality: "high",
        ...metadata,
      });
    },
    [trackPlayback],
  );

  /**
   * Track media pause
   */
  const trackPause = useCallback(
    async (
      trackId: string,
      position: number,
      metadata?: Record<string, any>,
    ) => {
      return await trackPlayback(ANALYTICS_EVENTS.PLAY_PAUSE, {
        trackId,
        position,
        ...metadata,
      });
    },
    [trackPlayback],
  );

  /**
   * Track media completion
   */
  const trackComplete = useCallback(
    async (
      trackId: string,
      artistId: string,
      duration: number,
      metadata?: Record<string, any>,
    ) => {
      return await trackPlayback(ANALYTICS_EVENTS.TRACK_COMPLETE, {
        trackId,
        artistId,
        position: duration,
        duration,
        ...metadata,
      });
    },
    [trackPlayback],
  );

  /**
   * Track like/unlike
   */
  const trackLike = useCallback(
    async (
      targetId: string,
      targetType: "track" | "album" | "artist" | "playlist",
      liked: boolean,
    ) => {
      const eventType = liked
        ? ANALYTICS_EVENTS.TRACK_LIKE
        : ANALYTICS_EVENTS.TRACK_UNLIKE;
      return await trackEngagement(eventType, {
        action: liked ? "like" : "unlike",
        targetId,
        targetType,
      });
    },
    [trackEngagement],
  );

  /**
   * Track sharing
   */
  const trackShare = useCallback(
    async (
      contentId: string,
      contentType: string,
      platform: string,
      metadata?: Record<string, any>,
    ) => {
      return await trackEngagement(ANALYTICS_EVENTS.SHARE_TRACK, {
        action: "share",
        targetId: contentId,
        targetType: contentType as any,
        metadata: {
          platform,
          ...metadata,
        },
      });
    },
    [trackEngagement],
  );

  /**
   * Track download
   */
  const trackDownload = useCallback(
    async (trackId: string, format: string, quality: string) => {
      return await trackEngagement(ANALYTICS_EVENTS.DOWNLOAD_START, {
        action: "download",
        targetId: trackId,
        targetType: "track",
        metadata: {
          format,
          quality,
        },
      });
    },
    [trackEngagement],
  );

  /**
   * Track error
   */
  const trackError = useCallback(
    async (
      errorType: string,
      errorMessage: string,
      context?: Record<string, any>,
    ) => {
      return await trackCustom("error", {
        errorType,
        errorMessage,
        context,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    },
    [trackCustom],
  );

  /**
   * Track performance metric
   */
  const trackPerformance = useCallback(
    async (metric: string, value: number, unit: string = "ms") => {
      if (!service.current) return false;
      return await service.current.trackPerformance(
        ANALYTICS_EVENTS.LATENCY_MEASUREMENT,
        {
          metric,
          value,
          unit,
        },
      );
    },
    [],
  );

  /**
   * Update user consent
   */
  const updateConsent = useCallback((consent: any) => {
    if (!service.current) return;
    service.current.updateConsent(consent);
  }, []);

  /**
   * Get consent status
   */
  const getConsentStatus = useCallback(() => {
    if (!service.current) return null;
    return service.current.getConsentStatus();
  }, []);

  /**
   * Get service metrics
   */
  const getMetrics = useCallback(() => {
    if (!service.current) return null;
    return service.current.getMetrics();
  }, []);

  /**
   * Flush pending events
   */
  const flush = useCallback(async () => {
    if (!service.current) return;
    await service.current.flush();
  }, []);

  return {
    // Core tracking methods
    trackPlayback,
    trackEngagement,
    trackCustom,

    // Convenience methods
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackPlay,
    trackPause,
    trackComplete,
    trackLike,
    trackShare,
    trackDownload,
    trackError,
    trackPerformance,

    // Privacy and consent
    updateConsent,
    getConsentStatus,

    // Service management
    getMetrics,
    flush,

    // Service instance (for advanced usage)
    service: service.current,
  };
};

/**
 * Hook for page view tracking
 */
export const usePageTracking = (
  pageName: string,
  pageTitle?: string,
  metadata?: Record<string, any>,
) => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName, pageTitle, metadata);
  }, [pageName, pageTitle, trackPageView]); // Re-track if page changes
};

/**
 * Hook for playback tracking
 */
export const usePlaybackTracking = () => {
  const { trackPlay, trackPause, trackComplete } = useAnalytics();
  const currentTrackRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);

  const startPlayback = useCallback(
    async (
      trackId: string,
      artistId?: string,
      metadata?: Record<string, any>,
    ) => {
      currentTrackRef.current = trackId;
      startTimeRef.current = Date.now();
      return await trackPlay(trackId, artistId, 0, metadata);
    },
    [trackPlay],
  );

  const pausePlayback = useCallback(
    async (position: number) => {
      if (!currentTrackRef.current) return false;
      return await trackPause(currentTrackRef.current, position);
    },
    [trackPause],
  );

  const completePlayback = useCallback(
    async (
      artistId: string,
      duration: number,
      metadata?: Record<string, any>,
    ) => {
      if (!currentTrackRef.current) return false;
      const result = await trackComplete(
        currentTrackRef.current,
        artistId,
        duration,
        metadata,
      );
      currentTrackRef.current = null;
      return result;
    },
    [trackComplete],
  );

  return {
    startPlayback,
    pausePlayback,
    completePlayback,
    currentTrack: currentTrackRef.current,
  };
};

/**
 * Hook for performance tracking
 */
export const usePerformanceTracking = () => {
  const { trackPerformance } = useAnalytics();

  const measurePageLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.performance) {
      const loadTime =
        window.performance.timing.loadEventEnd -
        window.performance.timing.navigationStart;
      trackPerformance("page_load_time", loadTime, "ms");
    }
  }, [trackPerformance]);

  const measureApiCall = useCallback(
    async (apiName: string, startTime: number) => {
      const duration = Date.now() - startTime;
      await trackPerformance(`api_call_${apiName}`, duration, "ms");
    },
    [trackPerformance],
  );

  const measureComponentRender = useCallback(
    async (componentName: string, renderTime: number) => {
      await trackPerformance(
        `component_render_${componentName}`,
        renderTime,
        "ms",
      );
    },
    [trackPerformance],
  );

  useEffect(() => {
    // Track page load performance
    if (document.readyState === "complete") {
      measurePageLoad();
    } else {
      window.addEventListener("load", measurePageLoad);
      return () => window.removeEventListener("load", measurePageLoad);
    }
  }, [measurePageLoad]);

  return {
    measurePageLoad,
    measureApiCall,
    measureComponentRender,
  };
};

/**
 * Hook for error tracking
 */
export const useErrorTracking = () => {
  const { trackError } = useAnalytics();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError("javascript_error", event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError("unhandled_promise_rejection", String(event.reason), {
        type: "promise_rejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [trackError]);

  return { trackError };
};

/**
 * Cleanup analytics service
 */
export const cleanupAnalytics = async () => {
  if (analyticsServiceInstance) {
    await analyticsServiceInstance.destroy();
    analyticsServiceInstance = null;
  }
};
