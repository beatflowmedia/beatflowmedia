// src/hooks/useAnalytics.js
// React hook for analytics integration with player context

import { useEffect, useRef } from "react";
import { useEnhancedPlayer } from "../context/EnhancedPlayerContext";
import PlayerAnalytics from "../services/analytics/PlayerAnalytics";
import AnalyticsService from "../services/analytics/AnalyticsService";
import { useCallback } from 'react';

/**
 * Hook for integrating analytics with the enhanced player
 */
export const useAnalytics = (options = {}) => {
  const { state, enhancedControls } = useEnhancedPlayer();
  const playerAnalyticsRef = useRef(null);
  const previousStateRef = useRef({});

  // Initialize analytics
  useEffect(() => {
    if (!playerAnalyticsRef.current) {
      playerAnalyticsRef.current = new PlayerAnalytics();
    }

    // Set user context if available
    if (options.userId) {
      AnalyticsService.setUser(options.userId, options.userProperties);
    }

    return () => {
      // Cleanup on unmount
      if (playerAnalyticsRef.current) {
        playerAnalyticsRef.current.trackSessionEnd();
      }
    };
  }, [options.userId]);

  // Track play state changes
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    const previousState = previousStateRef.current;
    const currentTrack = state.queue[state.currentIndex];

    // Track play/pause state changes
    if (state.isPlaying !== previousState.isPlaying) {
      if (state.isPlaying && currentTrack) {
        const playOptions = {
          queuePosition: state.currentIndex,
          source: "player",
          autoPlay: false,
          crossfadeEnabled: state.crossfadeEnabled,
          gaplessEnabled: state.gaplessEnabled
        };
        analytics.trackPlayStart(currentTrack, playOptions);
      } else if (!state.isPlaying && currentTrack) {
        analytics.trackPlayPause("user_action");
      }
    }

    // Update previous state
    previousStateRef.current = {
      isPlaying: state.isPlaying,
      currentIndex: state.currentIndex,
      volume: state.volume,
      currentTime: state.currentTime,
      quality: state.currentQuality
    };
  }, [state.isPlaying, state.currentIndex]);

  // Track track changes
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    const currentTrack = state.queue[state.currentIndex];
    const previousState = previousStateRef.current;

    if (state.currentIndex !== previousState.currentIndex && currentTrack) {
      // Track previous track end if it was playing
      if (previousState.isPlaying && previousState.currentIndex !== undefined) {
        analytics.trackPlayEnd("track_change");
      }

      // Track new track load
      analytics.trackTrackLoad(currentTrack, {
        quality: state.currentQuality,
        cacheHit: false, // Would be determined by engine
      });
    }
  }, [state.currentIndex, state.queue]);

  // Track time updates and seeking
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    analytics.updatePosition(state.currentTime);

    // Detect seeks (large time jumps)
    const previousTime = previousStateRef.current.currentTime || 0;
    const timeDiff = Math.abs(state.currentTime - previousTime);

    if (timeDiff > 2 && state.isPlaying) {
      // 2 second threshold for seek detection
      analytics.trackSeek(previousTime, state.currentTime, "user_seek");
    }
  }, [state.currentTime]);

  // Track duration updates
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    if (state.duration > 0) {
      analytics.updateDuration(state.duration);
    }
  }, [state.duration]);

  // Track volume changes
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    const previousVolume = previousStateRef.current.volume;
    if (state.volume !== previousVolume && previousVolume !== undefined) {
      analytics.trackVolumeChange(state.volume, previousVolume);
    }
  }, [state.volume]);

  // Track quality changes
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    const previousQuality = previousStateRef.current.quality;
    if (
      state.currentQuality !== previousQuality &&
      previousQuality !== undefined
    ) {
      analytics.trackQualityChange(
        previousQuality,
        state.currentQuality,
        state.adaptiveStreamingEnabled ? "adaptive" : "manual",
      );
    }
  }, [state.currentQuality]);

  // Track crossfade events
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    if (state.crossfadeActive) {
      const nextTrack = state.queue[state.currentIndex + 1];
      analytics.trackCrossfade("start", {
        nextTrackId: nextTrack?.id,
        duration: state.crossfadeDuration
      });
    }
  }, [state.crossfadeActive]);

  // Track buffer status
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    if (state.bufferStatus) {
      let eventType = "healthy";
      if (state.bufferStatus.level < 2) {
        eventType = "underrun";
      } else if (state.bufferStatus.level > 30) {
        eventType = "full";
      }

      analytics.trackBufferEvent(
        eventType,
        state.bufferStatus.level,
        state.networkStatus?.downlink,
      );
    }
  }, [state.bufferStatus]);

  // Track errors from session analytics
  useEffect(() => {
    const analytics = playerAnalyticsRef.current;
    if (!analytics) return;

    const errors = state.sessionAnalytics.errors;
    if (errors && errors.length > 0) {
      const lastError = errors[errors.length - 1];
      if (
        lastError &&
        lastError.timestamp > (previousStateRef.current.lastErrorTime || 0)
      ) {
        analytics.trackPlaybackError(
          new Error(lastError.message || "Unknown error"),
          {
            errorType: lastError.type,
            context: lastError.context
          },
        );
        previousStateRef.current.lastErrorTime = lastError.timestamp;
      }
    }
  }, [state.sessionAnalytics.errors]);

  // Callback functions for manual event tracking
  const trackEngagement = useCallback((eventType, data) => {
    const analytics = playerAnalyticsRef.current;
    if (analytics) {
      analytics.trackEngagement(eventType, data);
    }
  }, []);

  const trackLike = useCallback((liked = true) => {
    const analytics = playerAnalyticsRef.current;
    if (analytics) {
      analytics.trackLike(liked);
    }
  }, []);

  const trackShare = useCallback((shareMethod, recipientCount) => {
    const analytics = playerAnalyticsRef.current;
    if (analytics) {
      analytics.trackShare(shareMethod, recipientCount);
    }
  }, []);

  const trackPlaylistAction = useCallback((action, playlistData) => {
    const analytics = playerAnalyticsRef.current;
    if (analytics) {
      analytics.trackPlaylistAction(action, playlistData);
    }
  }, []);

  const trackDrmEvent = useCallback((eventType, licenseData) => {
    const analytics = playerAnalyticsRef.current;
    if (analytics) {
      analytics.trackDrmLicense(eventType, licenseData);
    }
  }, []);

  const trackCustomEvent = useCallback((eventName, eventData, options) => {
    AnalyticsService.trackEvent(eventName, eventData, options);
  }, []);

  const getAnalyticsSummary = useCallback(() => {
    const analytics = playerAnalyticsRef.current;
    return analytics ? analytics.getAnalyticsSummary() : null;
  }, []);

  const setConsentStatus = useCallback((consentTypes) => {
    AnalyticsService.updateConsent(consentTypes);
  }, []);

  const exportUserData = useCallback(async (format = "json") => {
    return await AnalyticsService.exportUserData(format);
  }, []);

  const deleteUserData = useCallback(async () => {
    return await AnalyticsService.deleteUserData();
  }, []);

  return {
    // Event tracking functions
    trackEngagement,
    trackLike,
    trackShare,
    trackPlaylistAction,
    trackDrmEvent,
    trackCustomEvent,

    // Analytics data
    getAnalyticsSummary,

    // Privacy controls
    setConsentStatus,
    exportUserData,
    deleteUserData,

    // Analytics service reference
    analyticsService: AnalyticsService,
    playerAnalytics: playerAnalyticsRef.current
  };
};

/**
 * Hook for tracking specific playlist interactions
 */
export const usePlaylistAnalytics = () => {
  const { trackPlaylistAction } = useAnalytics();

  const trackPlaylistCreate = useCallback(
    (playlist) => {
      trackPlaylistAction("create", {
        id: playlist.id,
        trackCount: playlist.tracks?.length || 0,
        visibility: playlist.visibility || "private",
        collaborative: playlist.collaborative || false
      });
    },
    [trackPlaylistAction],
  );

  const trackPlaylistEdit = useCallback(
    (playlist, changes) => {
      trackPlaylistAction("edit", {
        id: playlist.id,
        changes: Object.keys(changes),
        trackCount: playlist.tracks?.length || 0
      });
    },
    [trackPlaylistAction],
  );

  const trackPlaylistDelete = useCallback(
    (playlistId) => {
      trackPlaylistAction("delete", { id: playlistId });
    },
    [trackPlaylistAction],
  );

  const trackTrackAddToPlaylist = useCallback(
    (playlistId, trackId, position) => {
      trackPlaylistAction("add_track", {
        id: playlistId,
        trackId,
        position
      });
    },
    [trackPlaylistAction],
  );

  const trackTrackRemoveFromPlaylist = useCallback(
    (playlistId, trackId) => {
      trackPlaylistAction("remove_track", {
        id: playlistId,
        trackId
      });
    },
    [trackPlaylistAction],
  );

  return {
    trackPlaylistCreate,
    trackPlaylistEdit,
    trackPlaylistDelete,
    trackTrackAddToPlaylist,
    trackTrackRemoveFromPlaylist
  };
};

/**
 * Hook for tracking search and discovery events
 */
export const useDiscoveryAnalytics = () => {
  const { trackEngagement } = useAnalytics();

  const trackSearch = useCallback(
    (query, results, filters) => {
      trackEngagement("search", {
        query,
        result_count: results?.length || 0,
        filters: filters || {},
        timestamp: Date.now()
      });
    },
    [trackEngagement],
  );

  const trackSearchResult = useCallback(
    (query, result, position) => {
      trackEngagement("search_result_click", {
        query,
        result_type: result.type, // 'track', 'artist', 'album'
        result_id: result.id,
        position,
        timestamp: Date.now()
      });
    },
    [trackEngagement],
  );

  const trackRecommendation = useCallback(
    (recommendationType, items, source) => {
      trackEngagement("recommendation_view", {
        type: recommendationType,
        item_count: items?.length || 0,
        source,
        timestamp: Date.now()
      });
    },
    [trackEngagement],
  );

  const trackRecommendationClick = useCallback(
    (item, position, source) => {
      trackEngagement("recommendation_click", {
        item_type: item.type,
        item_id: item.id,
        position,
        source,
        timestamp: Date.now()
      });
    },
    [trackEngagement],
  );

  return {
    trackSearch,
    trackSearchResult,
    trackRecommendation,
    trackRecommendationClick
  };
};

/**
 * Hook for tracking user preferences and settings
 */
export const usePreferenceAnalytics = () => {
  const { trackEngagement } = useAnalytics();

  const trackSettingChange = useCallback(
    (setting, oldValue, newValue) => {
      trackEngagement("setting_change", {
        setting,
        old_value: oldValue,
        new_value: newValue,
        timestamp: Date.now()
      });
    },
    [trackEngagement],
  );

  const trackThemeChange = useCallback(
    (theme) => {
      trackSettingChange("theme", null, theme);
    },
    [trackSettingChange],
  );

  const trackLanguageChange = useCallback(
    (language) => {
      trackSettingChange("language", null, language);
    },
    [trackSettingChange],
  );

  const trackNotificationPreference = useCallback(
    (type, enabled) => {
      trackSettingChange(`notification_${type}`, null, enabled);
    },
    [trackSettingChange],
  );

  return {
    trackSettingChange,
    trackThemeChange,
    trackLanguageChange,
    trackNotificationPreference
  };
};

export default useAnalytics;
