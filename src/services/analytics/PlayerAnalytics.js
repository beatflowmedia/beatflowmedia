// src/services/analytics/PlayerAnalytics.js
// Player analytics integration for real-time event tracking with music industry compliance

import AnalyticsService from './AnalyticsService';
import { db, collection, setDoc, doc } from '../../firebaseConfig';

class PlayerAnalytics {
  async logEventToFirestore(eventType, eventData) {
    try {
      const eventId = `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(collection(db, 'playbackEvents'), eventId), {
        eventType,
        ...eventData,
        ts: Date.now()
      });
    } catch (err) {
      console.error('Failed to log playback event to Firestore:', err);
    }
  }
  constructor() {
    this.analyticsService = AnalyticsService;
    this.currentTrack = null;
    this.sessionStartTime = null;
    this.playStartTime = null;
    this.lastPosition = 0;
    this.seekCount = 0;
    this.bufferEvents = [];
    this.qualityChanges = [];
    this.errorEvents = [];

    // Playback state tracking
    this.playbackState = {
      isPlaying: false,
      duration: 0,
      position: 0,
      quality: 'unknown',
      bufferLevel: 0,
      volume: 1.0
    };

    // Session analytics
    this.sessionMetrics = {
      tracksPlayed: 0,
      totalPlaytime: 0,
      skipCount: 0,
      seekCount: 0,
      errorCount: 0,
      qualityChanges: 0,
      averageCompletion: 0
    };

    // Compliance tracking
    this.complianceData = {
      royaltyQualifyingPlays: 0,
      minimumPlayThreshold: 30, // seconds
      territorialRights: 'US',
      licenseType: 'standard'
    };

    this.initialize();
  }

  /**
   * Initialize player analytics
   */
  initialize() {
    this.sessionStartTime = Date.now();

    // Track session start
    this.analyticsService.trackEngagement('session_start', {
      timestamp: this.sessionStartTime,
      device_info: this.getDeviceInfo(),
      referrer: document.referrer,
      user_agent: navigator.userAgent
    });

    // Setup cleanup on page unload
    this.setupCleanupHandlers();
  }

  /**
   * Track track loading
   */
  trackTrackLoad(track, options = {}) {
  this.logEventToFirestore('track_load', { track, options });
    this.currentTrack = track;
    this.lastPosition = 0;
    this.seekCount = 0;
    this.bufferEvents = [];
    this.qualityChanges = [];

    this.analyticsService.trackPlayback('track_load', track, {
      load_time: options.loadTime,
      cache_hit: options.cacheHit,
      manifest_url: options.manifestUrl,
      initial_quality: options.quality
    });
  }

  /**
   * Track play start
   */
  trackPlayStart(track, options = {}) {
  this.logEventToFirestore('play_start', { track, options });
    if (!track) return;

    this.playStartTime = Date.now();
    this.playbackState.isPlaying = true;
    this.sessionMetrics.tracksPlayed++;

    const playbackData = {
      timestamp: this.playStartTime,
      track_duration: track.duration,
      queue_position: options.queuePosition,
      source: options.source || 'player',
      quality: this.playbackState.quality,
      crossfade_enabled: options.crossfadeEnabled,
      gapless_enabled: options.gaplessEnabled,
      auto_play: options.autoPlay || false
    };

    this.analyticsService.trackPlayback('play_start', track, playbackData);

    // Start tracking playback progress
    this.startProgressTracking();
  }

  /**
   * Track play pause
   */
  trackPlayPause(reason = 'user_action') {
  this.logEventToFirestore('play_pause', { track: this.currentTrack, reason });
    if (!this.currentTrack || !this.playbackState.isPlaying) return;

    const pauseTime = Date.now();
    const playDuration = pauseTime - this.playStartTime;

    this.playbackState.isPlaying = false;

    this.analyticsService.trackPlayback('play_pause', this.currentTrack, {
      timestamp: pauseTime,
      position: this.playbackState.position,
      play_duration: playDuration,
      reason: reason
    });

    this.stopProgressTracking();
  }

  /**
   * Track play resume
   */
  trackPlayResume(gapDuration = 0) {
    if (!this.currentTrack) return;

    this.playStartTime = Date.now();
    this.playbackState.isPlaying = true;

    this.analyticsService.trackPlayback('play_resume', this.currentTrack, {
      timestamp: this.playStartTime,
      position: this.playbackState.position,
      gap_duration: gapDuration
    });

    this.startProgressTracking();
  }

  /**
   * Track play end
   */
  trackPlayEnd(reason = 'natural_end') {
  this.logEventToFirestore('play_end', { track: this.currentTrack, reason });
    if (!this.currentTrack) return;

    const endTime = Date.now();
    const totalPlayTime = this.calculateTotalPlayTime();
    const completionPercentage = this.calculateCompletionPercentage();

    this.playbackState.isPlaying = false;

    // Update session metrics
    this.sessionMetrics.totalPlaytime += totalPlayTime;
    if (completionPercentage < 80) {
      this.sessionMetrics.skipCount++;
    }

    const playbackData = {
      timestamp: endTime,
      duration: totalPlayTime,
      completion_percentage: completionPercentage,
      reason: reason,
      seek_count: this.seekCount,
      buffer_events: this.bufferEvents.length,
      quality_changes: this.qualityChanges.length,
      final_position: this.playbackState.position
    };

    this.analyticsService.trackPlayback('play_end', this.currentTrack, playbackData);

    // Track royalty-qualifying play
    if (this.isRoyaltyQualifying(totalPlayTime, completionPercentage)) {
      this.trackRoyaltyQualifyingPlay(totalPlayTime, completionPercentage);
    }

    // Track completion if track was fully played
    if (completionPercentage >= 95) {
      this.trackTrackComplete();
    }

    this.stopProgressTracking();
  }

  /**
   * Track seek events
   */
  trackSeek(fromPosition, toPosition, reason = 'user_seek') {
  this.logEventToFirestore('seek', { track: this.currentTrack, fromPosition, toPosition, reason });
    if (!this.currentTrack) return;

    this.seekCount++;
    this.sessionMetrics.seekCount++;

    this.analyticsService.trackPlayback('seek', this.currentTrack, {
      timestamp: Date.now(),
      from_position: fromPosition,
      to_position: toPosition,
      seek_distance: Math.abs(toPosition - fromPosition),
      seek_reason: reason,
      total_seeks: this.seekCount
    });

    this.lastPosition = toPosition;
    this.playbackState.position = toPosition;
  }

  /**
   * Track volume changes
   */
  trackVolumeChange(newVolume, oldVolume) {
    this.playbackState.volume = newVolume;

    this.analyticsService.trackEngagement('volume_change', {
      timestamp: Date.now(),
      from_volume: oldVolume,
      to_volume: newVolume,
      muted: newVolume === 0
    });
  }

  /**
   * Track quality changes (adaptive streaming)
   */
  trackQualityChange(fromQuality, toQuality, reason = 'adaptive') {
    this.playbackState.quality = toQuality;
    this.qualityChanges.push({
      timestamp: Date.now(),
      from: fromQuality,
      to: toQuality,
      reason: reason
    });

    this.sessionMetrics.qualityChanges++;

    this.analyticsService.trackPerformance('quality_change', {
      timestamp: Date.now(),
      from_quality: fromQuality,
      to_quality: toQuality,
      trigger_reason: reason,
      network_speed: this.getNetworkSpeed(),
      buffer_level: this.playbackState.bufferLevel,
      auto_switch: reason === 'adaptive'
    });
  }

  /**
   * Track buffer events
   */
  trackBufferEvent(eventType, bufferLevel, networkSpeed) {
    this.playbackState.bufferLevel = bufferLevel;

    const bufferEvent = {
      timestamp: Date.now(),
      event_type: eventType, // 'underrun', 'healthy', 'full'
      buffer_level: bufferLevel,
      network_speed: networkSpeed,
      current_quality: this.playbackState.quality
    };

    this.bufferEvents.push(bufferEvent);

    this.analyticsService.trackPerformance('buffer_event', {
      ...bufferEvent,
      track_id: this.currentTrack?.id
    });

    // Track critical buffer underruns
    if (eventType === 'underrun') {
      this.trackBufferUnderrun(bufferLevel);
    }
  }

  /**
   * Track critical buffer underrun
   */
  trackBufferUnderrun(bufferLevel) {
    this.analyticsService.trackPerformance('buffer_underrun', {
      timestamp: Date.now(),
      buffer_level: bufferLevel,
      position: this.playbackState.position,
      quality: this.playbackState.quality,
      network_conditions: this.getNetworkConditions(),
      severity: bufferLevel < 1 ? 'critical' : 'warning'
    });
  }

  /**
   * Track playback errors
   */
  trackPlaybackError(error, context = {}) {
    const errorEvent = {
      timestamp: Date.now(),
      error_type: error.name || 'PlaybackError',
      error_message: error.message,
      error_code: error.code,
      stack_trace: error.stack,
      ...context
    };

    this.errorEvents.push(errorEvent);
    this.sessionMetrics.errorCount++;

    this.analyticsService.trackPerformance('error_event', {
      ...errorEvent,
      track_id: this.currentTrack?.id,
      position: this.playbackState.position,
      recovery_attempted: context.recoveryAttempted || false
    });
  }

  /**
   * Track DRM license events
   */
  trackDrmLicense(eventType, licenseData = {}) {
    this.analyticsService.trackSecurity(eventType, {
      timestamp: Date.now(),
      track_id: this.currentTrack?.id,
      license_server: licenseData.server,
      request_duration: licenseData.duration,
      success: licenseData.success,
      error_code: licenseData.errorCode,
      license_type: licenseData.licenseType || this.complianceData.licenseType
    });
  }

  /**
   * Track user engagement events
   */
  trackEngagement(eventType, data = {}) {
    const engagementData = {
      timestamp: Date.now(),
      track_id: this.currentTrack?.id,
      session_id: this.analyticsService.sessionId,
      ...data
    };

    this.analyticsService.trackEngagement(eventType, engagementData);
  }

  /**
   * Track playlist events
   */
  trackPlaylistAction(action, playlistData = {}) {
    this.trackEngagement(`playlist_${action}`, {
      playlist_id: playlistData.id,
      track_count: playlistData.trackCount,
      visibility: playlistData.visibility,
      collaborative: playlistData.collaborative
    });
  }

  /**
   * Track like/unlike events
   */
  trackLike(liked = true) {
    if (!this.currentTrack) return;

    this.trackEngagement(liked ? 'like_track' : 'unlike_track', {
      track_id: this.currentTrack.id,
      artist_id: this.currentTrack.artist_id,
      position: this.playbackState.position
    });
  }

  /**
   * Track share events
   */
  trackShare(shareMethod, recipientCount = 1) {
    if (!this.currentTrack) return;

    this.trackEngagement('share_track', {
      track_id: this.currentTrack.id,
      share_method: shareMethod,
      recipient_count: recipientCount,
      position: this.playbackState.position
    });
  }

  /**
   * Track crossfade events
   */
  trackCrossfade(eventType, crossfadeData = {}) {
    this.analyticsService.trackPerformance(`crossfade_${eventType}`, {
      timestamp: Date.now(),
      current_track_id: this.currentTrack?.id,
      next_track_id: crossfadeData.nextTrackId,
      duration: crossfadeData.duration,
      overlap_time: crossfadeData.overlapTime,
      fade_curve: crossfadeData.fadeCurve
    });
  }

  /**
   * Track gapless playback events
   */
  trackGaplessPlayback(success, gapDuration = 0) {
    this.analyticsService.trackPerformance('gapless_playback', {
      timestamp: Date.now(),
      success: success,
      gap_duration: gapDuration,
      previous_track_id: this.currentTrack?.id,
      buffer_level: this.playbackState.bufferLevel
    });
  }

  /**
   * Start progress tracking
   */
  startProgressTracking() {
    this.stopProgressTracking(); // Clear any existing interval

    this.progressInterval = setInterval(() => {
      this.trackProgress();
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop progress tracking
   */
  stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Track playback progress
   */
  trackProgress() {
    if (!this.currentTrack || !this.playbackState.isPlaying) return;

    const now = Date.now();
    const progressData = {
      timestamp: now,
      position: this.playbackState.position,
      duration: this.playbackState.duration,
      completion_percentage: this.calculateCompletionPercentage(),
      buffer_level: this.playbackState.bufferLevel,
      quality: this.playbackState.quality,
      volume: this.playbackState.volume
    };

    this.analyticsService.trackPlayback('playback_progress', this.currentTrack, progressData);
  }

  /**
   * Track royalty-qualifying play
   */
  trackRoyaltyQualifyingPlay(duration, completionPercentage) {
    this.complianceData.royaltyQualifyingPlays++;

    this.analyticsService.trackBusiness('royalty_calculation', {
      track_id: this.currentTrack.id,
      artist_id: this.currentTrack.artist_id,
      play_duration: duration,
      completion_percentage: completionPercentage,
      user_tier: this.getUserTier(),
      territory: this.complianceData.territorialRights,
      license_type: this.complianceData.licenseType,
      royalty_rate: this.getRoyaltyRate(),
      timestamp: Date.now()
    });
  }

  /**
   * Track track completion
   */
  trackTrackComplete() {
    const completionData = {
      timestamp: Date.now(),
      final_position: this.playbackState.position,
      seek_count: this.seekCount,
      buffer_events: this.bufferEvents.length,
      quality_changes: this.qualityChanges.length,
      play_count: 1 // This would be tracked across sessions
    };

    this.analyticsService.trackPlayback('track_complete', this.currentTrack, completionData);
  }

  /**
   * Track session end
   */
  trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;

    // Calculate average completion rate
    this.sessionMetrics.averageCompletion = this.sessionMetrics.tracksPlayed > 0
      ? (this.sessionMetrics.totalPlaytime / (this.sessionMetrics.tracksPlayed * 180)) * 100 // Assuming 3min average
      : 0;

    this.analyticsService.trackEngagement('session_end', {
      timestamp: Date.now(),
      duration: sessionDuration,
      tracks_played: this.sessionMetrics.tracksPlayed,
      total_playtime: this.sessionMetrics.totalPlaytime,
      skip_count: this.sessionMetrics.skipCount,
      seek_count: this.sessionMetrics.seekCount,
      error_count: this.sessionMetrics.errorCount,
      quality_changes: this.sessionMetrics.qualityChanges,
      average_completion: this.sessionMetrics.averageCompletion,
      royalty_qualifying_plays: this.complianceData.royaltyQualifyingPlays
    });
  }

  /**
   * Setup cleanup handlers
   */
  setupCleanupHandlers() {
    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      if (this.playbackState.isPlaying) {
        this.trackPlayEnd('page_unload');
      }
      this.trackSessionEnd();
    });

    // Track session end on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.playbackState.isPlaying) {
        this.trackPlayPause('page_hidden');
      }
    });
  }

  /**
   * Update playback position
   */
  updatePosition(position) {
    this.playbackState.position = position;
  }

  /**
   * Update track duration
   */
  updateDuration(duration) {
    this.playbackState.duration = duration;
  }

  /**
   * Set territorial rights
   */
  setTerritorialRights(territory) {
    this.complianceData.territorialRights = territory;
  }

  /**
   * Set license type
   */
  setLicenseType(licenseType) {
    this.complianceData.licenseType = licenseType;
  }

  /**
   * Calculate total play time for current track
   */
  calculateTotalPlayTime() {
    if (!this.playStartTime) return 0;
    return Date.now() - this.playStartTime;
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage() {
    if (!this.playbackState.duration || this.playbackState.duration === 0) return 0;
    return Math.min((this.playbackState.position / this.playbackState.duration) * 100, 100);
  }

  /**
   * Check if play qualifies for royalty
   */
  isRoyaltyQualifying(duration, completionPercentage) {
    return duration >= this.complianceData.minimumPlayThreshold * 1000 || // Convert to milliseconds
           completionPercentage >= 50;
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen_resolution: typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : null,
      viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
      pixel_ratio: typeof window !== 'undefined' ? window.devicePixelRatio : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Get network conditions
   */
  getNetworkConditions() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effective_type: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        save_data: conn.saveData
      };
    }
    return { effective_type: 'unknown' };
  }

  /**
   * Get network speed estimation
   */
  getNetworkSpeed() {
    const conn = navigator.connection;
    return conn ? conn.downlink : null;
  }

  /**
   * Get user tier for royalty calculation
   */
  getUserTier() {
    // This would be retrieved from user context
    return 'free'; // Placeholder
  }

  /**
   * Get royalty rate for current user
   */
  getRoyaltyRate() {
    const tier = this.getUserTier();
    const rates = {
      premium: 0.01,
      family: 0.008,
      student: 0.005,
      free: 0.001
    };
    return rates[tier] || 0.001;
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    return {
      session_metrics: this.sessionMetrics,
      compliance_data: this.complianceData,
      current_state: this.playbackState,
      session_duration: Date.now() - this.sessionStartTime
    };
  }

  /**
   * Reset analytics for new session
   */
  reset() {
    this.currentTrack = null;
    this.sessionStartTime = Date.now();
    this.playStartTime = null;
    this.lastPosition = 0;
    this.seekCount = 0;
    this.bufferEvents = [];
    this.qualityChanges = [];
    this.errorEvents = [];

    // Reset metrics
    this.sessionMetrics = {
      tracksPlayed: 0,
      totalPlaytime: 0,
      skipCount: 0,
      seekCount: 0,
      errorCount: 0,
      qualityChanges: 0,
      averageCompletion: 0
    };

    this.complianceData.royaltyQualifyingPlays = 0;
  }
}

export default PlayerAnalytics;