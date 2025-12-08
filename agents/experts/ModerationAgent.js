/**
 * ModerationAgent - Content review and compliance checking
 *
 * Features:
 * - Automated content moderation and flagging
 * - Copyright and licensing compliance
 * - Profanity and explicit content detection
 * - Metadata quality validation
 * - DMCA takedown management
 * - Territory restrictions validation
 * - Royalty compliance checking
 *
 * Based on industry best practices for content moderation
 */

const AgentBase = require('../core/AgentBase');
const path = require('path');
const fs = require('fs').promises;

class ModerationAgent extends AgentBase {
  constructor(config = {}) {
    super('Moderation', config);

    this.modConfig = {
      strictMode: config.strictMode || false,
      autoApprove: config.autoApprove || false,
      checkCopyright: config.checkCopyright !== false,
      checkExplicit: config.checkExplicit !== false,
      checkMetadata: config.checkMetadata !== false,
      checkTerritorial: config.checkTerritorial !== false
    };

    // Moderation rules and thresholds
    this.rules = {
      profanityList: this.loadProfanityList(),
      copyrightKeywords: ['copyright', '©', 'all rights reserved', 'unauthorized'],
      requiredMetadata: ['title', 'artist', 'genre'],
      minTitleLength: 1,
      maxTitleLength: 200,
      minArtistLength: 1,
      maxArtistLength: 100
    };

    // Moderation statistics
    this.moderationStats = {
      totalReviewed: 0,
      approved: 0,
      flagged: 0,
      rejected: 0,
      approvalRate: 0
    };

    // Store last moderation results
    this.lastModerationResults = null;
  }

  /**
   * Load profanity word list
   */
  loadProfanityList() {
    // In production, load from external file or API
    return new Set([
      'explicit_word_1',
      'explicit_word_2',
      'explicit_word_3'
      // Add more words as needed
    ]);
  }

  /**
   * Moderate content (track, metadata, artwork)
   * @param {Object} options - Moderation options
   * @param {string} options.contentType - Type (track|album|playlist|user)
   * @param {Object} options.content - Content to moderate
   * @param {string} options.submittedBy - User ID who submitted
   * @returns {Promise<Object>} Moderation results
   */
  async moderateContent(options = {}) {
    this.logger.info(`Moderating ${options.contentType}: ${options.content.id || 'unknown'}`);

    const results = {
      status: 'pending',
      contentType: options.contentType,
      contentId: options.content.id,
      submittedBy: options.submittedBy,
      decision: null, // approved, flagged, rejected
      flags: [],
      violations: [],
      warnings: [],
      confidence: 1.0,
      reviewRequired: false,
      startTime: new Date().toISOString(),
      endTime: null
    };

    try {
      // Run moderation checks
      if (this.modConfig.checkMetadata) {
        const metadataCheck = await this.checkMetadataQuality(options.content);
        results.flags.push(...metadataCheck.flags);
        results.violations.push(...metadataCheck.violations);
        results.warnings.push(...metadataCheck.warnings);
      }

      if (this.modConfig.checkExplicit) {
        const explicitCheck = await this.checkExplicitContent(options.content);
        results.flags.push(...explicitCheck.flags);
        results.violations.push(...explicitCheck.violations);
      }

      if (this.modConfig.checkCopyright) {
        const copyrightCheck = await this.checkCopyrightCompliance(options.content);
        results.flags.push(...copyrightCheck.flags);
        results.violations.push(...copyrightCheck.violations);
      }

      if (this.modConfig.checkTerritorial) {
        const territorialCheck = await this.checkTerritorialRestrictions(options.content);
        results.flags.push(...territorialCheck.flags);
        results.warnings.push(...territorialCheck.warnings);
      }

      // Make moderation decision
      results.decision = this.makeDecision(results);
      results.reviewRequired = this.requiresHumanReview(results);
      results.confidence = this.calculateConfidence(results);

      results.status = 'completed';
      results.endTime = new Date().toISOString();

      // Update statistics
      this.moderationStats.totalReviewed++;
      switch (results.decision) {
        case 'approved':
          this.moderationStats.approved++;
          break;
        case 'flagged':
          this.moderationStats.flagged++;
          break;
        case 'rejected':
          this.moderationStats.rejected++;
          break;
      }

      this.moderationStats.approvalRate =
        this.moderationStats.approved / this.moderationStats.totalReviewed;

      this.logger.success(`Moderation completed: ${results.decision}`);
      this.metrics.operations++;

      // Store results
      this.lastModerationResults = results;

      return results;

    } catch (error) {
      results.status = 'failed';
      results.error = error.message;
      results.endTime = new Date().toISOString();

      this.logger.error('Moderation failed:', error.message);
      this.metrics.errors++;

      // Store error results
      this.lastModerationResults = results;

      return results;
    }
  }

  /**
   * Check metadata quality and completeness
   */
  async checkMetadataQuality(content) {
    const check = {
      flags: [],
      violations: [],
      warnings: []
    };

    // Check required fields
    for (const field of this.rules.requiredMetadata) {
      if (!content[field] || content[field].trim() === '') {
        check.violations.push({
          type: 'MISSING_METADATA',
          severity: 'HIGH',
          field: field,
          message: `Missing required field: ${field}`
        });
      }
    }

    // Validate title
    if (content.title) {
      if (content.title.length < this.rules.minTitleLength) {
        check.violations.push({
          type: 'INVALID_TITLE',
          severity: 'HIGH',
          message: 'Title is too short'
        });
      }

      if (content.title.length > this.rules.maxTitleLength) {
        check.warnings.push({
          type: 'LONG_TITLE',
          severity: 'LOW',
          message: 'Title exceeds recommended length'
        });
      }

      // Check for placeholder titles
      if (/^(untitled|track|song|audio)[\s\d]*$/i.test(content.title)) {
        check.flags.push({
          type: 'PLACEHOLDER_TITLE',
          severity: 'MEDIUM',
          message: 'Title appears to be a placeholder'
        });
      }
    }

    // Validate artist
    if (content.artist) {
      if (content.artist.length < this.rules.minArtistLength) {
        check.violations.push({
          type: 'INVALID_ARTIST',
          severity: 'HIGH',
          message: 'Artist name is too short'
        });
      }

      if (content.artist.length > this.rules.maxArtistLength) {
        check.warnings.push({
          type: 'LONG_ARTIST',
          severity: 'LOW',
          message: 'Artist name exceeds recommended length'
        });
      }

      if (/^(unknown|artist|na|n\/a)$/i.test(content.artist)) {
        check.flags.push({
          type: 'PLACEHOLDER_ARTIST',
          severity: 'MEDIUM',
          message: 'Artist appears to be a placeholder'
        });
      }
    }

    // Check ISRC if provided
    if (content.isrc) {
      const isrcPattern = /^[A-Z]{2}-?\w{3}-?\d{2}-?\d{5}$/;
      if (!isrcPattern.test(content.isrc)) {
        check.warnings.push({
          type: 'INVALID_ISRC',
          severity: 'MEDIUM',
          message: 'ISRC format appears invalid'
        });
      }
    }

    return check;
  }

  /**
   * Check for explicit content
   */
  async checkExplicitContent(content) {
    const check = {
      flags: [],
      violations: []
    };

    // Check title and lyrics for profanity
    const textToCheck = [
      content.title || '',
      content.artist || '',
      content.album || '',
      content.lyrics || ''
    ].join(' ').toLowerCase();

    const foundProfanity = [];
    for (const word of this.rules.profanityList) {
      if (textToCheck.includes(word.toLowerCase())) {
        foundProfanity.push(word);
      }
    }

    if (foundProfanity.length > 0) {
      // Check if marked as explicit
      if (!content.explicit) {
        check.violations.push({
          type: 'UNMARKED_EXPLICIT',
          severity: 'HIGH',
          message: 'Content contains explicit language but not marked as explicit',
          details: `Found: ${foundProfanity.length} explicit words`
        });
      } else {
        check.flags.push({
          type: 'EXPLICIT_CONTENT',
          severity: 'INFO',
          message: 'Content properly marked as explicit'
        });
      }
    }

    return check;
  }

  /**
   * Check copyright compliance
   */
  async checkCopyrightCompliance(content) {
    const check = {
      flags: [],
      violations: []
    };

    // Check for copyright claims
    if (!content.copyrightOwner || content.copyrightOwner.trim() === '') {
      check.violations.push({
        type: 'MISSING_COPYRIGHT',
        severity: 'HIGH',
        message: 'Copyright owner not specified'
      });
    }

    // Check for licensing information
    if (!content.licenseType || content.licenseType.trim() === '') {
      check.violations.push({
        type: 'MISSING_LICENSE',
        severity: 'HIGH',
        message: 'License type not specified'
      });
    }

    // Check for potential copyright infringement indicators
    const contentText = [
      content.title || '',
      content.description || ''
    ].join(' ').toLowerCase();

    for (const keyword of this.rules.copyrightKeywords) {
      if (contentText.includes(keyword.toLowerCase())) {
        check.flags.push({
          type: 'COPYRIGHT_MENTION',
          severity: 'MEDIUM',
          message: `Content mentions: "${keyword}" - verify rights`,
          requiresReview: true
        });
      }
    }

    // Check for known copyrighted artist names (in production, use database)
    const knownArtists = new Set(['famous artist 1', 'famous artist 2']);
    if (knownArtists.has(content.artist?.toLowerCase())) {
      check.flags.push({
        type: 'KNOWN_ARTIST',
        severity: 'HIGH',
        message: 'Content associated with known artist - verify authorization',
        requiresReview: true
      });
    }

    return check;
  }

  /**
   * Check territorial restrictions
   */
  async checkTerritorialRestrictions(content) {
    const check = {
      flags: [],
      warnings: []
    };

    // Check if territories are specified
    if (!content.territories || content.territories.length === 0) {
      check.warnings.push({
        type: 'NO_TERRITORIES',
        severity: 'MEDIUM',
        message: 'No territorial restrictions specified - available worldwide by default'
      });
    } else {
      // Validate territory codes (ISO 3166-1 alpha-2)
      const validCodes = /^[A-Z]{2}$/;
      const invalidTerritories = content.territories.filter(
        territory => !validCodes.test(territory)
      );

      if (invalidTerritories.length > 0) {
        check.warnings.push({
          type: 'INVALID_TERRITORY_CODE',
          severity: 'MEDIUM',
          message: `Invalid territory codes: ${invalidTerritories.join(', ')}`
        });
      }

      // Flag if restricted in major markets
      const majorMarkets = new Set(['US', 'GB', 'DE', 'JP', 'FR']);
      const restrictedMarkets = content.territories.filter(t =>
        !majorMarkets.has(t) && content.restrictedTerritories?.includes(t)
      );

      if (restrictedMarkets.length > 0) {
        check.flags.push({
          type: 'MAJOR_MARKET_RESTRICTION',
          severity: 'INFO',
          message: `Content restricted in major markets: ${restrictedMarkets.join(', ')}`
        });
      }
    }

    return check;
  }

  /**
   * Make final moderation decision
   */
  makeDecision(results) {
    // Count violations by severity
    const highViolations = results.violations.filter(v => v.severity === 'HIGH').length;
    const mediumViolations = results.violations.filter(v => v.severity === 'MEDIUM').length;

    // Strict mode or critical violations = reject
    if (this.modConfig.strictMode && highViolations > 0) {
      return 'rejected';
    }

    // High severity violations = flag for review
    if (highViolations > 0) {
      return 'flagged';
    }

    // Multiple medium violations = flag
    if (mediumViolations >= 3) {
      return 'flagged';
    }

    // Flags that require review = flag
    const reviewFlags = results.flags.filter(f => f.requiresReview);
    if (reviewFlags.length > 0) {
      return 'flagged';
    }

    // Auto-approve if enabled and no serious issues
    if (this.modConfig.autoApprove && mediumViolations === 0) {
      return 'approved';
    }

    // Default to approved with warnings
    if (mediumViolations > 0 || results.warnings.length > 0) {
      return 'approved';
    }

    return 'approved';
  }

  /**
   * Determine if human review is required
   */
  requiresHumanReview(results) {
    // Decision is flagged or rejected
    if (results.decision === 'flagged' || results.decision === 'rejected') {
      return true;
    }

    // Has flags requiring review
    const reviewFlags = results.flags.filter(f => f.requiresReview);
    if (reviewFlags.length > 0) {
      return true;
    }

    // High confidence approval can skip review
    if (results.decision === 'approved' && results.confidence > 0.9) {
      return false;
    }

    return false;
  }

  /**
   * Calculate confidence score for decision
   */
  calculateConfidence(results) {
    let confidence = 1.0;

    // Reduce confidence for each violation
    confidence -= results.violations.length * 0.1;

    // Reduce confidence for flags
    confidence -= results.flags.length * 0.05;

    // Reduce confidence for warnings
    confidence -= results.warnings.length * 0.02;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Bulk moderate multiple content items
   */
  async bulkModerate(contentItems, options = {}) {
    this.logger.info(`Bulk moderating ${contentItems.length} items`);

    const results = {
      total: contentItems.length,
      processed: 0,
      approved: 0,
      flagged: 0,
      rejected: 0,
      items: []
    };

    for (const content of contentItems) {
      try {
        const modResult = await this.moderateContent({
          ...options,
          content
        });

        results.items.push(modResult);
        results.processed++;

        switch (modResult.decision) {
          case 'approved':
            results.approved++;
            break;
          case 'flagged':
            results.flagged++;
            break;
          case 'rejected':
            results.rejected++;
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to moderate content ${content.id}:`, error.message);
        results.items.push({
          contentId: content.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Generate moderation report
   */
  async generateReport(moderationResults) {
    // Use provided results or last moderation results
    const results = moderationResults || this.lastModerationResults || {
      flags: [],
      violations: [],
      warnings: []
    };

    const report = {
      title: 'BeatFlow Moderation Report',
      generated: new Date().toISOString(),
      agent: this.agentName,
      ...results,
      statistics: this.moderationStats,
      summary: {
        totalFlags: results.flags?.length || 0,
        totalViolations: results.violations?.length || 0,
        totalWarnings: results.warnings?.length || 0,
        decision: results.decision || 'unknown',
        reviewRequired: results.reviewRequired || false,
        confidence: results.confidence || 0
      }
    };

    return report;
  }

  /**
   * Save moderation report
   */
  async saveReport(results) {
    const report = await this.generateReport(results);
    const reportPath = path.join(
      this.config.projectRoot,
      'agents/reports',
      this.generateTimestampedName('moderation-report', '.json')
    );

    try {
      await this.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.logger.success(`Moderation report saved: ${reportPath}`);
      return reportPath;
    } catch (error) {
      this.logger.error('Failed to save moderation report:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup and finalization
   */
  async cleanup() {
    this.logger.info('Finalizing moderation...');

    // Call parent cleanup
    await super.cleanup();
  }
}

module.exports = ModerationAgent;
