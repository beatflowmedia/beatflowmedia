/**
 * MetricsCollector - Collects and aggregates analytics metrics
 *
 * Features:
 * - Event collection and buffering
 * - Metrics aggregation (playback, engagement, revenue, performance)
 * - Compliance validation
 * - Export to various formats
 *
 * Based on src/services/analytics/AnalyticsConfig.js
 */

const fs = require('fs').promises;
const path = require('path');

class MetricsCollector {
  constructor(options = {}) {
    this.options = {
      bufferSize: options.bufferSize || 100,
      flushInterval: options.flushInterval || 5000,
      enableCompliance: options.enableCompliance !== false,
      royaltyPrecision: options.royaltyPrecision || 4,
      minimumPlayDuration: options.minimumPlayDuration || 30,
      ...options
    };

    // Event buffers by priority
    this.buffers = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };

    // Metrics state
    this.metrics = {
      eventsCollected: 0,
      eventsProcessed: 0,
      eventsDropped: 0,
      eventsExported: 0,
      lastFlushTime: Date.now(),
      errorCount: 0
    };

    // Aggregated metrics
    this.aggregations = {
      playback: {
        totalPlays: 0,
        totalDuration: 0,
        completionRate: 0,
        averageCompletion: 0,
        byTrack: new Map(),
        byArtist: new Map(),
        byUser: new Map()
      },
      engagement: {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalLikes: 0,
        totalPlaylists: 0,
        totalShares: 0,
        activeUsers: new Set()
      },
      performance: {
        averageBufferTime: 0,
        errorRate: 0,
        qualityChanges: 0,
        drmFailures: 0
      },
      revenue: {
        totalRoyalties: 0,
        byTrack: new Map(),
        byArtist: new Map(),
        byTerritory: new Map()
      }
    };

    // Event schemas (from AnalyticsConfig.js)
    this.eventSchemas = this.loadEventSchemas();
  }

  /**
   * Load event schemas for validation
   */
  loadEventSchemas() {
    return {
      playback: {
        play_start: {
          required: ['user_id', 'track_id', 'session_id', 'timestamp'],
          optional: ['playlist_id', 'queue_position', 'source', 'quality']
        },
        play_end: {
          required: [
            'user_id',
            'track_id',
            'session_id',
            'timestamp',
            'duration',
            'completion_percentage'
          ],
          optional: ['reason', 'next_track_id']
        },
        track_complete: {
          required: ['user_id', 'track_id', 'session_id', 'timestamp', 'duration'],
          optional: ['replay_count']
        }
      },
      engagement: {
        session_start: {
          required: ['user_id', 'session_id', 'timestamp', 'device_info'],
          optional: ['referrer', 'utm_parameters']
        },
        session_end: {
          required: ['user_id', 'session_id', 'timestamp', 'duration'],
          optional: ['tracks_played', 'last_activity']
        },
        like_track: {
          required: ['user_id', 'track_id', 'timestamp'],
          optional: ['playlist_context']
        }
      },
      performance: {
        buffer_event: {
          required: [
            'user_id',
            'track_id',
            'session_id',
            'timestamp',
            'event_type',
            'buffer_level'
          ],
          optional: ['network_speed', 'quality_level']
        },
        error_event: {
          required: [
            'user_id',
            'session_id',
            'timestamp',
            'error_type',
            'error_message'
          ],
          optional: ['track_id', 'stack_trace', 'browser_info']
        }
      },
      business: {
        royalty_calculation: {
          required: [
            'track_id',
            'artist_id',
            'timestamp',
            'play_count',
            'revenue_amount'
          ],
          optional: ['territory', 'user_tier']
        },
        payment_event: {
          required: ['user_id', 'timestamp', 'event_type', 'amount'],
          optional: ['currency', 'payment_method', 'transaction_id']
        }
      }
    };
  }

  /**
   * Collect an analytics event
   * @param {string} category - Event category (playback, engagement, performance, business)
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {string} priority - Event priority (critical, high, normal, low)
   * @returns {Object} Collection result
   */
  collectEvent(category, eventType, data, priority = 'normal') {
    const result = {
      collected: false,
      errors: [],
      warnings: []
    };

    try {
      // Validate event
      const validation = this.validateEvent(category, eventType, data);

      if (!validation.valid) {
        result.errors.push(...validation.errors);
        this.metrics.eventsDropped++;
        return result;
      }

      // Add metadata
      const event = {
        category,
        type: eventType,
        data: {
          ...data,
          collected_at: Date.now()
        },
        priority,
        timestamp: data.timestamp || Date.now()
      };

      // Add to buffer
      if (!this.buffers[priority]) {
        priority = 'normal';
      }

      this.buffers[priority].push(event);
      this.metrics.eventsCollected++;

      // Check if buffer needs flushing
      const totalBuffered = Object.values(this.buffers).reduce(
        (sum, buffer) => sum + buffer.length,
        0
      );

      if (totalBuffered >= this.options.bufferSize) {
        result.warnings.push({
          type: 'BUFFER_FULL',
          message: 'Event buffer is full, consider flushing',
          bufferSize: totalBuffered
        });
      }

      result.collected = true;
      result.event = event;

      return result;
    } catch (error) {
      result.errors.push({
        type: 'COLLECTION_ERROR',
        message: error.message,
        stack: error.stack
      });
      this.metrics.errorCount++;
      return result;
    }
  }

  /**
   * Validate event against schema
   */
  validateEvent(category, eventType, data) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check if schema exists
    const categorySchemas = this.eventSchemas[category];
    if (!categorySchemas) {
      result.valid = false;
      result.errors.push({
        type: 'INVALID_CATEGORY',
        message: `Unknown event category: ${category}`,
        category
      });
      return result;
    }

    const schema = categorySchemas[eventType];
    if (!schema) {
      result.valid = false;
      result.errors.push({
        type: 'INVALID_EVENT_TYPE',
        message: `Unknown event type: ${eventType}`,
        eventType
      });
      return result;
    }

    // Check required fields
    for (const field of schema.required) {
      if (!data[field]) {
        result.valid = false;
        result.errors.push({
          type: 'MISSING_REQUIRED_FIELD',
          message: `Missing required field: ${field}`,
          field
        });
      }
    }

    // Compliance checks
    if (this.options.enableCompliance && category === 'playback') {
      if (eventType === 'play_end' || eventType === 'track_complete') {
        if (data.duration && data.duration < this.options.minimumPlayDuration) {
          result.warnings.push({
            type: 'BELOW_MINIMUM_PLAY_DURATION',
            message: `Play duration (${data.duration}s) is below minimum (${this.options.minimumPlayDuration}s) for royalty qualification`,
            duration: data.duration,
            minimum: this.options.minimumPlayDuration
          });
        }
      }
    }

    return result;
  }

  /**
   * Process buffered events and update aggregations
   */
  processEvents() {
    const processed = {
      total: 0,
      byCategory: {},
      errors: []
    };

    try {
      // Process all buffers in priority order
      const priorities = ['critical', 'high', 'normal', 'low'];

      for (const priority of priorities) {
        const events = this.buffers[priority];

        for (const event of events) {
          try {
            this.aggregateEvent(event);
            processed.total++;

            if (!processed.byCategory[event.category]) {
              processed.byCategory[event.category] = 0;
            }
            processed.byCategory[event.category]++;

            this.metrics.eventsProcessed++;
          } catch (error) {
            processed.errors.push({
              event: event.type,
              error: error.message
            });
            this.metrics.errorCount++;
          }
        }

        // Clear buffer
        this.buffers[priority] = [];
      }

      this.metrics.lastFlushTime = Date.now();

      return processed;
    } catch (error) {
      processed.errors.push({
        type: 'PROCESSING_ERROR',
        message: error.message
      });
      return processed;
    }
  }

  /**
   * Aggregate event into metrics
   */
  aggregateEvent(event) {
    const { category, type, data } = event;

    switch (category) {
      case 'playback':
        this.aggregatePlaybackEvent(type, data);
        break;

      case 'engagement':
        this.aggregateEngagementEvent(type, data);
        break;

      case 'performance':
        this.aggregatePerformanceEvent(type, data);
        break;

      case 'business':
        this.aggregateBusinessEvent(type, data);
        break;
    }
  }

  /**
   * Aggregate playback events
   */
  aggregatePlaybackEvent(type, data) {
    if (type === 'play_start') {
      this.aggregations.playback.totalPlays++;

      // Track by track
      if (data.track_id) {
        const trackStats = this.aggregations.playback.byTrack.get(data.track_id) || {
          plays: 0,
          completions: 0,
          totalDuration: 0
        };
        trackStats.plays++;
        this.aggregations.playback.byTrack.set(data.track_id, trackStats);
      }

      // Track by artist
      if (data.artist_id) {
        const artistStats = this.aggregations.playback.byArtist.get(data.artist_id) || {
          plays: 0,
          uniqueTracks: new Set()
        };
        artistStats.plays++;
        if (data.track_id) {
          artistStats.uniqueTracks.add(data.track_id);
        }
        this.aggregations.playback.byArtist.set(data.artist_id, artistStats);
      }
    }

    if (type === 'play_end' || type === 'track_complete') {
      if (data.duration) {
        this.aggregations.playback.totalDuration += data.duration;
      }

      if (data.completion_percentage) {
        const currentAvg = this.aggregations.playback.averageCompletion;
        const count = this.aggregations.playback.totalPlays;
        this.aggregations.playback.averageCompletion =
          (currentAvg * (count - 1) + data.completion_percentage) / count;

        // Track completion by track
        if (data.track_id && data.completion_percentage >= 95) {
          const trackStats = this.aggregations.playback.byTrack.get(data.track_id);
          if (trackStats) {
            trackStats.completions++;
          }
        }
      }
    }
  }

  /**
   * Aggregate engagement events
   */
  aggregateEngagementEvent(type, data) {
    if (type === 'session_start') {
      this.aggregations.engagement.totalSessions++;

      if (data.user_id) {
        this.aggregations.engagement.activeUsers.add(data.user_id);
      }
    }

    if (type === 'session_end' && data.duration) {
      const currentAvg = this.aggregations.engagement.averageSessionDuration;
      const count = this.aggregations.engagement.totalSessions;
      this.aggregations.engagement.averageSessionDuration =
        (currentAvg * (count - 1) + data.duration) / count;
    }

    if (type === 'like_track') {
      this.aggregations.engagement.totalLikes++;
    }

    if (type === 'playlist_create') {
      this.aggregations.engagement.totalPlaylists++;
    }

    if (type === 'share_track') {
      this.aggregations.engagement.totalShares++;
    }
  }

  /**
   * Aggregate performance events
   */
  aggregatePerformanceEvent(type, data) {
    if (type === 'buffer_event') {
      const currentAvg = this.aggregations.performance.averageBufferTime;
      const count = this.metrics.eventsProcessed;

      if (data.buffer_level) {
        this.aggregations.performance.averageBufferTime =
          (currentAvg * (count - 1) + data.buffer_level) / count;
      }
    }

    if (type === 'error_event') {
      this.aggregations.performance.errorRate =
        (this.metrics.errorCount / this.metrics.eventsProcessed) * 100;
    }

    if (type === 'quality_change') {
      this.aggregations.performance.qualityChanges++;
    }
  }

  /**
   * Aggregate business events
   */
  aggregateBusinessEvent(type, data) {
    if (type === 'royalty_calculation') {
      if (data.revenue_amount) {
        this.aggregations.revenue.totalRoyalties += data.revenue_amount;

        // By track
        if (data.track_id) {
          const trackRevenue = this.aggregations.revenue.byTrack.get(data.track_id) || 0;
          this.aggregations.revenue.byTrack.set(data.track_id, trackRevenue + data.revenue_amount);
        }

        // By artist
        if (data.artist_id) {
          const artistRevenue = this.aggregations.revenue.byArtist.get(data.artist_id) || 0;
          this.aggregations.revenue.byArtist.set(data.artist_id, artistRevenue + data.revenue_amount);
        }

        // By territory
        if (data.territory) {
          const territoryRevenue = this.aggregations.revenue.byTerritory.get(data.territory) || 0;
          this.aggregations.revenue.byTerritory.set(data.territory, territoryRevenue + data.revenue_amount);
        }
      }
    }
  }

  /**
   * Get aggregated metrics summary
   */
  getMetricsSummary() {
    return {
      collection: {
        eventsCollected: this.metrics.eventsCollected,
        eventsProcessed: this.metrics.eventsProcessed,
        eventsDropped: this.metrics.eventsDropped,
        errorCount: this.metrics.errorCount,
        errorRate: (this.metrics.errorCount / this.metrics.eventsCollected * 100).toFixed(2) + '%'
      },
      playback: {
        totalPlays: this.aggregations.playback.totalPlays,
        totalDuration: this.aggregations.playback.totalDuration,
        averageDuration: (this.aggregations.playback.totalDuration / this.aggregations.playback.totalPlays).toFixed(2),
        averageCompletion: this.aggregations.playback.averageCompletion.toFixed(2) + '%',
        uniqueTracks: this.aggregations.playback.byTrack.size,
        uniqueArtists: this.aggregations.playback.byArtist.size
      },
      engagement: {
        totalSessions: this.aggregations.engagement.totalSessions,
        averageSessionDuration: this.aggregations.engagement.averageSessionDuration.toFixed(2),
        activeUsers: this.aggregations.engagement.activeUsers.size,
        totalLikes: this.aggregations.engagement.totalLikes,
        totalPlaylists: this.aggregations.engagement.totalPlaylists,
        totalShares: this.aggregations.engagement.totalShares
      },
      performance: {
        averageBufferTime: this.aggregations.performance.averageBufferTime.toFixed(2),
        errorRate: this.aggregations.performance.errorRate.toFixed(2) + '%',
        qualityChanges: this.aggregations.performance.qualityChanges
      },
      revenue: {
        totalRoyalties: this.aggregations.revenue.totalRoyalties.toFixed(this.options.royaltyPrecision),
        trackCount: this.aggregations.revenue.byTrack.size,
        artistCount: this.aggregations.revenue.byArtist.size,
        territoryCount: this.aggregations.revenue.byTerritory.size
      }
    };
  }

  /**
   * Export metrics to various formats
   */
  async exportMetrics(format = 'json') {
    const summary = this.getMetricsSummary();
    const detailedMetrics = {
      summary,
      timestamp: new Date().toISOString(),
      detailed: {
        playback: {
          byTrack: Array.from(this.aggregations.playback.byTrack.entries()).map(([id, stats]) => ({
            trackId: id,
            ...stats
          })),
          byArtist: Array.from(this.aggregations.playback.byArtist.entries()).map(([id, stats]) => ({
            artistId: id,
            plays: stats.plays,
            uniqueTracks: stats.uniqueTracks.size
          }))
        },
        revenue: {
          byTrack: Array.from(this.aggregations.revenue.byTrack.entries()).map(([id, amount]) => ({
            trackId: id,
            revenue: amount.toFixed(this.options.royaltyPrecision)
          })),
          byArtist: Array.from(this.aggregations.revenue.byArtist.entries()).map(([id, amount]) => ({
            artistId: id,
            revenue: amount.toFixed(this.options.royaltyPrecision)
          })),
          byTerritory: Array.from(this.aggregations.revenue.byTerritory.entries()).map(([id, amount]) => ({
            territory: id,
            revenue: amount.toFixed(this.options.royaltyPrecision)
          }))
        }
      }
    };

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(detailedMetrics, null, 2);

      case 'csv':
        return this.convertToCSV(detailedMetrics);

      case 'markdown':
        return this.convertToMarkdown(detailedMetrics);

      default:
        return JSON.stringify(detailedMetrics, null, 2);
    }
  }

  /**
   * Convert metrics to CSV format
   */
  convertToCSV(metrics) {
    let csv = '# Analytics Metrics Summary\n\n';

    // Summary section
    csv += 'Category,Metric,Value\n';
    for (const [category, data] of Object.entries(metrics.summary)) {
      for (const [metric, value] of Object.entries(data)) {
        csv += `${category},${metric},${value}\n`;
      }
    }

    return csv;
  }

  /**
   * Convert metrics to Markdown format
   */
  convertToMarkdown(metrics) {
    let md = '# Analytics Metrics Report\n\n';
    md += `**Generated:** ${metrics.timestamp}\n\n`;

    md += '## Summary\n\n';

    for (const [category, data] of Object.entries(metrics.summary)) {
      md += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      md += '| Metric | Value |\n';
      md += '|--------|-------|\n';

      for (const [metric, value] of Object.entries(data)) {
        md += `| ${metric} | ${value} |\n`;
      }

      md += '\n';
    }

    return md;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.buffers = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };

    this.metrics = {
      eventsCollected: 0,
      eventsProcessed: 0,
      eventsDropped: 0,
      eventsExported: 0,
      lastFlushTime: Date.now(),
      errorCount: 0
    };

    this.aggregations = {
      playback: {
        totalPlays: 0,
        totalDuration: 0,
        completionRate: 0,
        averageCompletion: 0,
        byTrack: new Map(),
        byArtist: new Map(),
        byUser: new Map()
      },
      engagement: {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalLikes: 0,
        totalPlaylists: 0,
        totalShares: 0,
        activeUsers: new Set()
      },
      performance: {
        averageBufferTime: 0,
        errorRate: 0,
        qualityChanges: 0,
        drmFailures: 0
      },
      revenue: {
        totalRoyalties: 0,
        byTrack: new Map(),
        byArtist: new Map(),
        byTerritory: new Map()
      }
    };
  }
}

module.exports = MetricsCollector;
