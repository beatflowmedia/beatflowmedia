/**
 * MusicUXPatterns - Music Streaming UX Pattern Validator
 *
 * Validates music-specific user experience patterns for streaming platforms
 * Based on Spotify design principles and best practices
 *
 * Features:
 * - Playback control accessibility and usability
 * - Album art optimization and loading
 * - Search UX patterns
 * - Playlist interaction validation
 * - Audio visualization accessibility
 * - Performance patterns for music content
 */

const fs = require('fs').promises;
const path = require('path');

class MusicUXPatterns {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      validatePerformance: config.validatePerformance !== false,
      validateAccessibility: config.validateAccessibility !== false,
      ...config
    };

    this.patterns = [];
  }

  /**
   * Validate music UX patterns in a file
   */
  async validateFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const patterns = [];

    // Determine component type
    const componentType = this.detectComponentType(filePath, content);

    switch (componentType) {
      case 'player':
        patterns.push(...this.validateMusicPlayer(content, filePath));
        break;
      case 'album':
        patterns.push(...this.validateAlbumView(content, filePath));
        break;
      case 'playlist':
        patterns.push(...this.validatePlaylist(content, filePath));
        break;
      case 'search':
        patterns.push(...this.validateSearch(content, filePath));
        break;
      case 'track':
        patterns.push(...this.validateTrackItem(content, filePath));
        break;
    }

    // General music patterns
    patterns.push(...this.validatePlaybackControls(content, filePath));
    patterns.push(...this.validateAudioVisuals(content, filePath));
    patterns.push(...this.validateImageOptimization(content, filePath));

    return patterns;
  }

  /**
   * Detect component type from file path and content
   */
  detectComponentType(filePath, content) {
    const fileName = path.basename(filePath).toLowerCase();

    if (fileName.includes('player') || fileName.includes('musicplayer')) return 'player';
    if (fileName.includes('album')) return 'album';
    if (fileName.includes('playlist')) return 'playlist';
    if (fileName.includes('search')) return 'search';
    if (fileName.includes('track') || fileName.includes('song')) return 'track';

    return 'general';
  }

  /**
   * Validate music player component
   */
  validateMusicPlayer(content, filePath) {
    const issues = [];

    // Check for play/pause button accessibility
    if ((content.includes('play') || content.includes('pause')) &&
        !content.includes('aria-label')) {
      issues.push({
        type: 'PLAYER_MISSING_ARIA_LABELS',
        severity: 'HIGH',
        category: 'playback-controls',
        file: filePath,
        message: 'Play/pause controls missing aria-label',
        recommendation: 'Add aria-label with dynamic state (e.g., aria-label={isPlaying ? "Pause" : "Play"})',
        musicSpecific: true
      });
    }

    // Check for keyboard shortcuts
    if (!content.includes('onKeyDown') && !content.includes('useKeyboard')) {
      issues.push({
        type: 'PLAYER_NO_KEYBOARD_SHORTCUTS',
        severity: 'MEDIUM',
        category: 'playback-controls',
        file: filePath,
        message: 'Music player missing keyboard shortcuts',
        recommendation: 'Add keyboard shortcuts (Space: play/pause, Arrow keys: seek)',
        musicSpecific: true
      });
    }

    // Check for volume controls
    if (content.includes('volume') || content.includes('Volume')) {
      if (!content.includes('aria-valuemin')) {
        issues.push({
          type: 'VOLUME_MISSING_ARIA_VALUES',
          severity: 'MEDIUM',
          category: 'playback-controls',
          file: filePath,
          message: 'Volume control missing ARIA value attributes',
          recommendation: 'Add aria-valuemin={0} aria-valuemax={100} aria-valuenow={volume}',
          musicSpecific: true
        });
      }
    }

    // Check for progress/seek bar
    if (content.includes('progress') || content.includes('seek')) {
      if (!content.includes('aria-valuenow')) {
        issues.push({
          type: 'PROGRESS_BAR_NO_ARIA',
          severity: 'MEDIUM',
          category: 'playback-controls',
          file: filePath,
          message: 'Progress/seek bar missing ARIA attributes',
          recommendation: 'Add aria-valuenow, aria-valuemin, aria-valuemax for current time',
          musicSpecific: true
        });
      }
    }

    // Check for loading states
    if (!content.includes('loading') && !content.includes('Loading')) {
      issues.push({
        type: 'PLAYER_NO_LOADING_STATE',
        severity: 'LOW',
        category: 'user-feedback',
        file: filePath,
        message: 'Music player missing loading state',
        recommendation: 'Add loading state for buffering/loading audio',
        musicSpecific: true
      });
    }

    return issues;
  }

  /**
   * Validate album view component
   */
  validateAlbumView(content, filePath) {
    const issues = [];

    // Check for album art optimization
    if (content.includes('img') || content.includes('<Image')) {
      if (!content.includes('lazy') && !content.includes('loading="lazy"')) {
        issues.push({
          type: 'ALBUM_ART_NOT_LAZY_LOADED',
          severity: 'MEDIUM',
          category: 'performance',
          file: filePath,
          message: 'Album artwork not lazy loaded',
          recommendation: 'Use lazy loading for album art images',
          musicSpecific: true
        });
      }

      if (!content.includes('alt=')) {
        issues.push({
          type: 'ALBUM_ART_MISSING_ALT',
          severity: 'HIGH',
          category: 'accessibility',
          file: filePath,
          message: 'Album artwork missing alt text',
          recommendation: 'Add descriptive alt text (e.g., "Album cover for {albumName} by {artistName}")',
          musicSpecific: true
        });
      }
    }

    // Check for play button on album
    if (content.includes('album') && !content.includes('play')) {
      issues.push({
        type: 'ALBUM_MISSING_PLAY_BUTTON',
        severity: 'LOW',
        category: 'user-experience',
        file: filePath,
        message: 'Album view missing quick play button',
        recommendation: 'Add play button overlay on album artwork',
        musicSpecific: true
      });
    }

    return issues;
  }

  /**
   * Validate playlist component
   */
  validatePlaylist(content, filePath) {
    const issues = [];

    // Check for drag-and-drop
    if (!content.includes('drag') && !content.includes('Drag')) {
      issues.push({
        type: 'PLAYLIST_NO_DRAG_DROP',
        severity: 'LOW',
        category: 'interaction',
        file: filePath,
        message: 'Playlist missing drag-and-drop reordering',
        recommendation: 'Add drag-and-drop for reordering tracks',
        musicSpecific: true
      });
    }

    // Check for keyboard navigation in list
    if (content.includes('map') && !content.includes('onKeyDown')) {
      issues.push({
        type: 'PLAYLIST_NO_KEYBOARD_NAV',
        severity: 'MEDIUM',
        category: 'accessibility',
        file: filePath,
        message: 'Playlist items missing keyboard navigation',
        recommendation: 'Add arrow key navigation between tracks',
        musicSpecific: true
      });
    }

    // Check for virtual scrolling on long playlists
    if (content.includes('.map(') && !content.includes('virtual') && !content.includes('Virtualized')) {
      issues.push({
        type: 'PLAYLIST_NO_VIRTUAL_SCROLL',
        severity: 'MEDIUM',
        category: 'performance',
        file: filePath,
        message: 'Long playlist without virtual scrolling',
        recommendation: 'Implement virtual scrolling for playlists with 100+ tracks',
        musicSpecific: true
      });
    }

    return issues;
  }

  /**
   * Validate search component
   */
  validateSearch(content, filePath) {
    const issues = [];

    // Check for debouncing
    if (content.includes('onChange') && !content.includes('debounce') && !content.includes('useDebounce')) {
      issues.push({
        type: 'SEARCH_NOT_DEBOUNCED',
        severity: 'MEDIUM',
        category: 'performance',
        file: filePath,
        message: 'Search input not debounced',
        recommendation: 'Add debouncing (300ms) to search input to reduce API calls',
        musicSpecific: true
      });
    }

    // Check for loading indicator
    if (!content.includes('loading') && !content.includes('isLoading')) {
      issues.push({
        type: 'SEARCH_NO_LOADING_STATE',
        severity: 'LOW',
        category: 'user-feedback',
        file: filePath,
        message: 'Search missing loading indicator',
        recommendation: 'Add loading state while searching',
        musicSpecific: true
      });
    }

    // Check for empty state
    if (!content.includes('no results') && !content.includes('NoResults') && !content.includes('empty')) {
      issues.push({
        type: 'SEARCH_NO_EMPTY_STATE',
        severity: 'LOW',
        category: 'user-feedback',
        file: filePath,
        message: 'Search missing empty state',
        recommendation: 'Add "No results found" message',
        musicSpecific: true
      });
    }

    // Check for autocomplete/suggestions
    if (!content.includes('suggestions') && !content.includes('autocomplete')) {
      issues.push({
        type: 'SEARCH_NO_AUTOCOMPLETE',
        severity: 'INFO',
        category: 'user-experience',
        file: filePath,
        message: 'Search could benefit from autocomplete',
        recommendation: 'Consider adding search suggestions/autocomplete',
        musicSpecific: true
      });
    }

    return issues;
  }

  /**
   * Validate track/song item component
   */
  validateTrackItem(content, filePath) {
    const issues = [];

    // Check for context menu
    if (!content.includes('contextmenu') && !content.includes('ContextMenu')) {
      issues.push({
        type: 'TRACK_NO_CONTEXT_MENU',
        severity: 'LOW',
        category: 'interaction',
        file: filePath,
        message: 'Track item missing context menu',
        recommendation: 'Add right-click context menu for track actions',
        musicSpecific: true
      });
    }

    // Check for like/favorite button
    if (!content.includes('like') && !content.includes('favorite') && !content.includes('heart')) {
      issues.push({
        type: 'TRACK_NO_LIKE_BUTTON',
        severity: 'INFO',
        category: 'user-experience',
        file: filePath,
        message: 'Track item missing like/favorite button',
        recommendation: 'Add like button for quick favoriting',
        musicSpecific: true
      });
    }

    return issues;
  }

  /**
   * Validate playback controls
   */
  validatePlaybackControls(content, filePath) {
    const issues = [];

    const playbackElements = ['play', 'pause', 'next', 'previous', 'shuffle', 'repeat'];

    playbackElements.forEach(element => {
      if (content.includes(element)) {
        // Check for proper touch target size
        const context = this.getElementContext(content, element);

        if (context && !this.hasMinimumTouchTarget(context)) {
          issues.push({
            type: 'PLAYBACK_CONTROL_SMALL_TARGET',
            severity: 'MEDIUM',
            category: 'accessibility',
            file: filePath,
            message: `${element} button may be too small for touch`,
            recommendation: 'Ensure playback controls are at least 44x44px',
            musicSpecific: true
          });
        }
      }
    });

    return issues;
  }

  /**
   * Validate audio visualizations
   */
  validateAudioVisuals(content, filePath) {
    const issues = [];

    if (content.includes('visuali') || content.includes('waveform') || content.includes('spectrum')) {
      // Check for reduced motion
      if (!content.includes('prefers-reduced-motion') && !content.includes('prefersReducedMotion')) {
        issues.push({
          type: 'AUDIO_VISUAL_NO_REDUCED_MOTION',
          severity: 'MEDIUM',
          category: 'accessibility',
          file: filePath,
          message: 'Audio visualization not respecting reduced motion preferences',
          recommendation: 'Disable or simplify animations when prefers-reduced-motion is enabled',
          musicSpecific: true
        });
      }

      // Check for performance optimization
      if (!content.includes('requestAnimationFrame') && !content.includes('useAnimationFrame')) {
        issues.push({
          type: 'AUDIO_VISUAL_NO_RAF',
          severity: 'LOW',
          category: 'performance',
          file: filePath,
          message: 'Audio visualization should use requestAnimationFrame',
          recommendation: 'Use requestAnimationFrame for smooth 60fps animations',
          musicSpecific: true
        });
      }
    }

    return issues;
  }

  /**
   * Validate image optimization patterns
   */
  validateImageOptimization(content, filePath) {
    const issues = [];

    // Check for album art/images
    if (content.includes('img') || content.includes('Image')) {
      // Check for responsive images
      if (!content.includes('srcSet') && !content.includes('srcset')) {
        issues.push({
          type: 'IMAGE_NO_SRCSET',
          severity: 'LOW',
          category: 'performance',
          file: filePath,
          message: 'Images missing srcset for responsive loading',
          recommendation: 'Use srcset to serve appropriately sized images',
          musicSpecific: false
        });
      }

      // Check for WebP format
      if (!content.includes('webp') && !content.includes('format')) {
        issues.push({
          type: 'IMAGE_NO_WEBP',
          severity: 'INFO',
          category: 'performance',
          file: filePath,
          message: 'Consider using WebP format for album art',
          recommendation: 'Use WebP with fallback for better compression',
          musicSpecific: true
        });
      }

      // Check for loading="lazy"
      if (!content.includes('loading') && !content.includes('lazy')) {
        issues.push({
          type: 'IMAGE_NOT_LAZY',
          severity: 'MEDIUM',
          category: 'performance',
          file: filePath,
          message: 'Images not lazy loaded',
          recommendation: 'Add loading="lazy" or implement intersection observer',
          musicSpecific: false
        });
      }
    }

    return issues;
  }

  /**
   * Get context around an element
   */
  getElementContext(content, element) {
    const index = content.indexOf(element);
    if (index === -1) return null;

    return content.substring(
      Math.max(0, index - 200),
      Math.min(content.length, index + 200)
    );
  }

  /**
   * Check if element has minimum touch target size
   */
  hasMinimumTouchTarget(context) {
    // Simple check - look for explicit size declarations
    const sizePattern = /(?:width|height|minWidth|minHeight):\s*["']?(\d+)(?:px)?["']?/g;
    const matches = context.matchAll(sizePattern);

    for (const match of matches) {
      const size = parseInt(match[1]);
      if (size >= 44) return true;
    }

    return false;
  }

  /**
   * Calculate music UX score
   */
  calculateMusicUXScore(issues) {
    if (issues.length === 0) return 100;

    const severityPenalties = {
      CRITICAL: 10,
      HIGH: 5,
      MEDIUM: 2,
      LOW: 1,
      INFO: 0.5
    };

    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + (severityPenalties[issue.severity] || 1);
    }, 0);

    return Math.max(0, 100 - totalPenalty);
  }
}

module.exports = MusicUXPatterns;
