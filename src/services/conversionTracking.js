// src/services/conversionTracking.js
// DRY service for Meta Pixel and TikTok Pixel conversion tracking
// Centralized tracking to avoid code duplication

/**
 * Conversion Tracking Service
 *
 * Handles all Meta (Facebook) Pixel and TikTok Pixel event tracking
 * Use this service instead of calling fbq() or ttq() directly
 *
 * @example
 * import { trackConversion } from '../services/conversionTracking';
 * trackConversion('ViewContent', { content_name: 'Song Name' });
 */

// Check if pixels are loaded
const isMetaPixelLoaded = () => typeof window !== 'undefined' && typeof window.fbq === 'function';
const isTikTokPixelLoaded = () => typeof window !== 'undefined' && typeof window.ttq === 'object';

/**
 * Track page view on both pixels
 * Call this on route changes or initial page load
 */
export const trackPageView = () => {
  if (isMetaPixelLoaded()) {
    window.fbq('track', 'PageView');
  }

  if (isTikTokPixelLoaded()) {
    window.ttq.page();
  }
};

/**
 * Track custom conversion event on both pixels
 *
 * @param {string} eventName - Standard event name (ViewContent, AddToCart, Lead, Purchase, etc.)
 * @param {object} eventData - Event parameters
 * @param {object} options - { metaOnly, tiktokOnly } to track on specific pixels
 */
export const trackConversion = (eventName, eventData = {}, options = {}) => {
  const { metaOnly = false, tiktokOnly = false } = options;

  // Meta Pixel tracking
  if (!tiktokOnly && isMetaPixelLoaded()) {
    try {
      window.fbq('track', eventName, eventData);
    } catch (error) {
      console.error('Meta Pixel tracking error:', error);
    }
  }

  // TikTok Pixel tracking
  if (!metaOnly && isTikTokPixelLoaded()) {
    try {
      window.ttq.track(eventName, eventData);
    } catch (error) {
      console.error('TikTok Pixel tracking error:', error);
    }
  }
};

/**
 * Track song/content view
 * @param {object} song - Song object with id, title, artist, genre
 */
export const trackSongView = (song) => {
  if (!song || !song.id) return;

  trackConversion('ViewContent', {
    content_type: 'music',
    content_ids: [song.id],
    content_name: song.title || 'Untitled',
    content_category: song.genre || 'Music',
    value: 0,
    currency: 'USD'
  });
};

/**
 * Track artist profile view
 * @param {string} artistName - Artist name
 */
export const trackArtistView = (artistName) => {
  if (!artistName) return;

  trackConversion('ViewContent', {
    content_type: 'artist',
    content_name: artistName,
    content_category: 'Artist Profile'
  });
};

/**
 * Track playlist view
 * @param {object} playlist - Playlist object with id, name
 */
export const trackPlaylistView = (playlist) => {
  if (!playlist || !playlist.id) return;

  trackConversion('ViewContent', {
    content_type: 'playlist',
    content_ids: [playlist.id],
    content_name: playlist.name || 'Untitled Playlist',
    content_category: 'Playlist'
  });
};

/**
 * Track when user adds song to playlist (high-intent action)
 * @param {object} song - Song object
 * @param {string} playlistId - Target playlist ID
 */
export const trackAddToPlaylist = (song, playlistId) => {
  if (!song || !playlistId) return;

  trackConversion('AddToCart', {
    content_type: 'music',
    content_ids: [song.id],
    content_name: song.title || 'Untitled',
    value: 1,
    currency: 'USD'
  });
};

/**
 * Track when user follows an artist (high-value conversion)
 * @param {string} artistName - Artist name
 */
export const trackFollow = (artistName) => {
  if (!artistName) return;

  trackConversion('Lead', {
    content_name: artistName,
    content_category: 'Artist Follow',
    value: 5, // Assign value to follows
    currency: 'USD'
  });
};

/**
 * Track when user saves/likes a song
 * @param {object} song - Song object
 */
export const trackSave = (song) => {
  if (!song || !song.id) return;

  trackConversion('AddToWishlist', {
    content_type: 'music',
    content_ids: [song.id],
    content_name: song.title || 'Untitled',
    value: 2,
    currency: 'USD'
  });
};

/**
 * Track email capture (lead generation)
 * @param {string} source - Where the email was captured (e.g., 'fan_capture_modal', 'newsletter_signup')
 */
export const trackEmailCapture = (source = 'unknown') => {
  trackConversion('Lead', {
    content_name: 'Email Capture',
    content_category: source,
    value: 10,
    currency: 'USD'
  });
};

/**
 * Track play button click (engagement)
 * @param {object} song - Song object
 */
export const trackPlayClick = (song) => {
  if (!song || !song.id) return;

  trackConversion('ClickButton', {
    content_type: 'music',
    content_ids: [song.id],
    content_name: song.title || 'Untitled',
    button_text: 'Play'
  }, { tiktokOnly: true }); // TikTok specific event

  // Meta: Track as custom event
  if (isMetaPixelLoaded()) {
    window.fbq('trackCustom', 'PlaySong', {
      content_name: song.title || 'Untitled',
      song_id: song.id
    });
  }
};

/**
 * Track share action
 * @param {string} contentType - 'song', 'playlist', 'artist'
 * @param {string} contentId - ID of shared content
 * @param {string} platform - 'twitter', 'facebook', 'tiktok', etc.
 */
export const trackShare = (contentType, contentId, platform) => {
  if (!contentType || !contentId) return;

  trackConversion('Share', {
    content_type: contentType,
    content_ids: [contentId],
    method: platform || 'unknown'
  }, { tiktokOnly: true });

  // Meta: Track as custom event
  if (isMetaPixelLoaded()) {
    window.fbq('trackCustom', 'ShareContent', {
      content_type: contentType,
      content_id: contentId,
      share_platform: platform
    });
  }
};

/**
 * Track subscription purchase (ultimate conversion)
 * @param {string} planName - Subscription plan name
 * @param {number} value - Purchase value in USD
 */
export const trackPurchase = (planName, value) => {
  if (!planName || !value) return;

  trackConversion('Purchase', {
    content_name: planName,
    value: value,
    currency: 'USD'
  });
};

/**
 * Track account registration
 * @param {string} method - Registration method (e.g., 'google', 'email')
 */
export const trackRegistration = (method = 'unknown') => {
  trackConversion('CompleteRegistration', {
    content_name: 'Account Registration',
    registration_method: method,
    value: 15,
    currency: 'USD'
  });
};

/**
 * Track search action
 * @param {string} searchQuery - What user searched for
 */
export const trackSearch = (searchQuery) => {
  if (!searchQuery) return;

  trackConversion('Search', {
    search_string: searchQuery
  });
};

/**
 * Track when user starts playing a song (30s+ completion)
 * Used for algorithmic quality scoring
 * @param {object} song - Song object
 * @param {number} completionPercent - How much of the song was played (0-100)
 */
export const trackSongCompletion = (song, completionPercent) => {
  if (!song || !song.id || completionPercent < 30) return;

  // Only track if user listened to at least 30%
  if (isMetaPixelLoaded()) {
    window.fbq('trackCustom', 'SongCompleted', {
      song_id: song.id,
      song_name: song.title || 'Untitled',
      completion_percent: completionPercent,
      high_engagement: completionPercent >= 80
    });
  }
};

/**
 * Track when user skips a song early (quality signal)
 * @param {object} song - Song object
 * @param {number} skipTime - When user skipped (in seconds)
 */
export const trackSongSkip = (song, skipTime) => {
  if (!song || !song.id) return;

  // Only track early skips (before 30s)
  if (skipTime < 30 && isMetaPixelLoaded()) {
    window.fbq('trackCustom', 'SongSkipped', {
      song_id: song.id,
      song_name: song.title || 'Untitled',
      skip_time: skipTime
    });
  }
};

const conversionTracking = {
  trackPageView,
  trackConversion,
  trackSongView,
  trackArtistView,
  trackPlaylistView,
  trackAddToPlaylist,
  trackFollow,
  trackSave,
  trackEmailCapture,
  trackPlayClick,
  trackShare,
  trackPurchase,
  trackRegistration,
  trackSearch,
  trackSongCompletion,
  trackSongSkip
};
export default conversionTracking;;
