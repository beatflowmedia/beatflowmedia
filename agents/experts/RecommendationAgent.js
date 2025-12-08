/**
 * RecommendationAgent - ML-based content recommendation system
 *
 * Features:
 * - User behavior analysis and preference learning
 * - Collaborative filtering recommendations
 * - Content-based filtering (genre, mood, tempo)
 * - Hybrid recommendation strategies
 * - Real-time personalization
 * - A/B testing for recommendation algorithms
 *
 * Based on best practices for recommendation systems
 */

const AgentBase = require('../core/AgentBase');
const path = require('path');
const fs = require('fs').promises;

class RecommendationAgent extends AgentBase {
  constructor(config = {}) {
    super('Recommendation', config);

    this.recConfig = {
      algorithm: config.algorithm || 'hybrid', // collaborative, content-based, hybrid
      maxRecommendations: config.maxRecommendations || 20,
      minSimilarityScore: config.minSimilarityScore || 0.3,
      diversityFactor: config.diversityFactor || 0.2,
      enableRealtime: config.enableRealtime !== false,
      enableABTesting: config.enableABTesting || false
    };

    // Recommendation models
    this.models = {
      userProfiles: new Map(),
      itemVectors: new Map(),
      similarityMatrix: new Map(),
      trendingScores: new Map()
    };

    // Metrics tracking
    this.recommendationMetrics = {
      generated: 0,
      clicked: 0,
      played: 0,
      completed: 0,
      clickThroughRate: 0,
      completionRate: 0
    };

    // Store last recommendations for report generation
    this.lastRecommendations = null;
  }

  /**
   * Generate personalized recommendations for a user
   * @param {Object} options - Recommendation options
   * @param {string} options.userId - User ID to generate recommendations for
   * @param {string} options.context - Context (home, search, playlist, artist)
   * @param {number} options.limit - Number of recommendations to return
   * @param {Array} options.excludeIds - Track IDs to exclude
   * @returns {Promise<Object>} Recommendations with scores and explanations
   */
  async generateRecommendations(options = {}) {
    this.logger.info(`Generating recommendations for user ${options.userId}`);

    const results = {
      status: 'pending',
      userId: options.userId,
      context: options.context || 'home',
      algorithm: this.recConfig.algorithm,
      recommendations: [],
      metadata: {
        totalCandidates: 0,
        filteredCount: 0,
        diversityScore: 0
      },
      startTime: new Date().toISOString(),
      endTime: null
    };

    try {
      // Load user profile and history
      const userProfile = await this.loadUserProfile(options.userId);
      const userHistory = await this.loadUserHistory(options.userId);

      // Get candidate tracks based on algorithm
      let candidates = [];
      switch (this.recConfig.algorithm) {
        case 'collaborative':
          candidates = await this.collaborativeFiltering(userProfile, userHistory);
          break;
        case 'content-based':
          candidates = await this.contentBasedFiltering(userProfile, userHistory);
          break;
        case 'hybrid':
          candidates = await this.hybridFiltering(userProfile, userHistory);
          break;
        default:
          candidates = await this.hybridFiltering(userProfile, userHistory);
      }

      results.metadata.totalCandidates = candidates.length;

      // Apply filters
      candidates = this.applyFilters(candidates, options.excludeIds || []);
      results.metadata.filteredCount = candidates.length;

      // Apply diversity
      candidates = this.applyDiversity(candidates, this.recConfig.diversityFactor);
      results.metadata.diversityScore = this.calculateDiversityScore(candidates);

      // Sort by score and limit
      candidates = candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, options.limit || this.recConfig.maxRecommendations);

      // Generate explanations
      results.recommendations = candidates.map(candidate => ({
        trackId: candidate.trackId,
        title: candidate.title,
        artist: candidate.artist,
        score: candidate.score,
        confidence: candidate.confidence,
        reason: this.generateExplanation(candidate, userProfile),
        factors: candidate.factors
      }));

      results.status = 'completed';
      results.endTime = new Date().toISOString();

      this.logger.success(`Generated ${results.recommendations.length} recommendations`);
      this.metrics.operations++;
      this.recommendationMetrics.generated += results.recommendations.length;

      // Store results
      this.lastRecommendations = results;

      return results;

    } catch (error) {
      results.status = 'failed';
      results.error = error.message;
      results.endTime = new Date().toISOString();

      this.logger.error('Recommendation generation failed:', error.message);
      this.metrics.errors++;

      // Store error results
      this.lastRecommendations = results;

      return results;
    }
  }

  /**
   * Collaborative filtering - based on similar users
   */
  async collaborativeFiltering(userProfile, userHistory) {
    this.logger.info('Running collaborative filtering');

    // Find similar users
    const similarUsers = await this.findSimilarUsers(userProfile, 50);

    // Get tracks liked by similar users
    const candidates = [];
    const trackScores = new Map();

    for (const similarUser of similarUsers) {
      const tracks = await this.getUserLikedTracks(similarUser.userId);

      for (const track of tracks) {
        // Skip tracks user already interacted with
        if (userHistory.playedTracks.has(track.trackId)) continue;

        const currentScore = trackScores.get(track.trackId) || 0;
        const weightedScore = similarUser.similarityScore * track.likeWeight;
        trackScores.set(track.trackId, currentScore + weightedScore);
      }
    }

    // Convert to candidate objects
    for (const [trackId, score] of trackScores.entries()) {
      const trackInfo = await this.getTrackInfo(trackId);
      candidates.push({
        trackId,
        title: trackInfo.title,
        artist: trackInfo.artist,
        score: score,
        confidence: Math.min(score / 10, 1),
        factors: { collaborative: score },
        method: 'collaborative'
      });
    }

    return candidates;
  }

  /**
   * Content-based filtering - based on track features
   */
  async contentBasedFiltering(userProfile, userHistory) {
    this.logger.info('Running content-based filtering');

    const candidates = [];

    // Get user's preferred genres, artists, moods
    const preferences = this.extractPreferences(userProfile, userHistory);

    // Get catalog tracks
    const catalogTracks = await this.getCatalogTracks();

    for (const track of catalogTracks) {
      // Skip tracks user already interacted with
      if (userHistory.playedTracks.has(track.trackId)) continue;

      // Calculate similarity score
      const genreScore = this.calculateGenreSimilarity(track.genre, preferences.genres);
      const artistScore = preferences.artists.has(track.artistId) ? 1.0 : 0;
      const moodScore = this.calculateMoodSimilarity(track.mood, preferences.moods);
      const tempoScore = this.calculateTempoSimilarity(track.tempo, preferences.avgTempo);

      // Weighted combination
      const score = (
        genreScore * 0.4 +
        artistScore * 0.3 +
        moodScore * 0.2 +
        tempoScore * 0.1
      );

      if (score >= this.recConfig.minSimilarityScore) {
        candidates.push({
          trackId: track.trackId,
          title: track.title,
          artist: track.artist,
          score: score,
          confidence: score,
          factors: {
            genre: genreScore,
            artist: artistScore,
            mood: moodScore,
            tempo: tempoScore
          },
          method: 'content-based'
        });
      }
    }

    return candidates;
  }

  /**
   * Hybrid filtering - combine collaborative and content-based
   */
  async hybridFiltering(userProfile, userHistory) {
    this.logger.info('Running hybrid filtering');

    // Get candidates from both methods
    const collaborativeCandidates = await this.collaborativeFiltering(userProfile, userHistory);
    const contentCandidates = await this.contentBasedFiltering(userProfile, userHistory);

    // Merge and combine scores
    const mergedScores = new Map();

    // Add collaborative scores
    for (const candidate of collaborativeCandidates) {
      mergedScores.set(candidate.trackId, {
        ...candidate,
        collaborativeScore: candidate.score,
        contentScore: 0
      });
    }

    // Add/merge content-based scores
    for (const candidate of contentCandidates) {
      if (mergedScores.has(candidate.trackId)) {
        const existing = mergedScores.get(candidate.trackId);
        existing.contentScore = candidate.score;
        existing.factors = { ...existing.factors, ...candidate.factors };
      } else {
        mergedScores.set(candidate.trackId, {
          ...candidate,
          collaborativeScore: 0,
          contentScore: candidate.score
        });
      }
    }

    // Calculate hybrid scores (weighted combination)
    const hybridCandidates = Array.from(mergedScores.values()).map(candidate => ({
      ...candidate,
      score: (candidate.collaborativeScore * 0.6 + candidate.contentScore * 0.4),
      confidence: Math.min((candidate.collaborativeScore + candidate.contentScore) / 2, 1),
      method: 'hybrid'
    }));

    return hybridCandidates;
  }

  /**
   * Apply filters to candidate list
   */
  applyFilters(candidates, excludeIds) {
    return candidates.filter(candidate => !excludeIds.includes(candidate.trackId));
  }

  /**
   * Apply diversity to avoid too similar recommendations
   */
  applyDiversity(candidates, diversityFactor) {
    if (diversityFactor === 0 || candidates.length <= 5) return candidates;

    const diverse = [];
    const usedArtists = new Set();
    const usedGenres = new Set();

    // Sort by score first
    const sorted = [...candidates].sort((a, b) => b.score - a.score);

    for (const candidate of sorted) {
      const artistCount = usedArtists.has(candidate.artist) ? 1 : 0;
      const genreCount = usedGenres.has(candidate.factors?.genre) ? 1 : 0;

      // Apply diversity penalty
      const diversityPenalty = (artistCount + genreCount) * diversityFactor;
      candidate.score = candidate.score * (1 - diversityPenalty);

      diverse.push(candidate);
      usedArtists.add(candidate.artist);
      usedGenres.add(candidate.factors?.genre);
    }

    return diverse;
  }

  /**
   * Calculate diversity score for recommendations
   */
  calculateDiversityScore(candidates) {
    if (candidates.length === 0) return 0;

    const uniqueArtists = new Set(candidates.map(c => c.artist)).size;
    const uniqueGenres = new Set(candidates.map(c => c.factors?.genre)).size;

    return ((uniqueArtists / candidates.length) + (uniqueGenres / candidates.length)) / 2;
  }

  /**
   * Generate human-readable explanation for recommendation
   */
  generateExplanation(candidate, userProfile) {
    const reasons = [];

    if (candidate.method === 'collaborative') {
      reasons.push('Users with similar taste enjoyed this');
    }

    if (candidate.factors?.artist > 0.5) {
      reasons.push(`You like ${candidate.artist}`);
    }

    if (candidate.factors?.genre > 0.5) {
      reasons.push('Matches your preferred genre');
    }

    if (candidate.factors?.mood > 0.5) {
      reasons.push('Fits your listening mood');
    }

    return reasons.length > 0 ? reasons.join('. ') : 'Recommended for you';
  }

  /**
   * Load user profile from database/cache
   */
  async loadUserProfile(userId) {
    // In production, load from Firestore
    // For now, return mock profile
    return {
      userId,
      preferredGenres: ['Pop', 'R&B', 'Jazz'],
      preferredArtists: ['Artist 1', 'Artist 2'],
      avgListenDuration: 180,
      avgTempo: 120,
      lastActiveDate: new Date().toISOString()
    };
  }

  /**
   * Load user history from database
   */
  async loadUserHistory(userId) {
    // In production, load from Firestore
    // For now, return mock history
    return {
      userId,
      playedTracks: new Set(['track1', 'track2', 'track3']),
      likedTracks: new Set(['track1', 'track2']),
      skippedTracks: new Set(['track4']),
      createdPlaylists: ['playlist1'],
      followedArtists: ['artist1', 'artist2']
    };
  }

  /**
   * Find users similar to given user
   */
  async findSimilarUsers(userProfile, limit = 50) {
    // In production, use vector similarity search
    // For now, return mock similar users
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      userId: `user${i + 1}`,
      similarityScore: 0.8 - (i * 0.05)
    }));
  }

  /**
   * Get tracks liked by a user
   */
  async getUserLikedTracks(userId) {
    // In production, query Firestore
    // For now, return mock tracks
    return [
      { trackId: 'track5', likeWeight: 1.0 },
      { trackId: 'track6', likeWeight: 0.8 },
      { trackId: 'track7', likeWeight: 0.6 }
    ];
  }

  /**
   * Get track information
   */
  async getTrackInfo(trackId) {
    // In production, query Firestore
    return {
      trackId,
      title: `Track ${trackId}`,
      artist: 'Unknown Artist',
      genre: 'Pop',
      mood: 'Upbeat',
      tempo: 120
    };
  }

  /**
   * Get catalog tracks for content-based filtering
   */
  async getCatalogTracks() {
    // In production, query Firestore with pagination
    // For now, return mock catalog
    return Array.from({ length: 50 }, (_, i) => ({
      trackId: `catalog_track_${i + 1}`,
      title: `Catalog Track ${i + 1}`,
      artist: `Artist ${(i % 5) + 1}`,
      artistId: `artist${(i % 5) + 1}`,
      genre: ['Pop', 'Rock', 'Jazz', 'R&B', 'Electronic'][i % 5],
      mood: ['Upbeat', 'Chill', 'Energetic', 'Melancholic', 'Happy'][i % 5],
      tempo: 100 + (i % 60)
    }));
  }

  /**
   * Extract preferences from user profile and history
   */
  extractPreferences(userProfile, userHistory) {
    return {
      genres: new Set(userProfile.preferredGenres || []),
      artists: new Set([...userProfile.preferredArtists, ...userHistory.followedArtists]),
      moods: new Set(['Upbeat', 'Chill']),
      avgTempo: userProfile.avgTempo || 120
    };
  }

  /**
   * Calculate genre similarity
   */
  calculateGenreSimilarity(trackGenre, preferredGenres) {
    return preferredGenres.has(trackGenre) ? 1.0 : 0.0;
  }

  /**
   * Calculate mood similarity
   */
  calculateMoodSimilarity(trackMood, preferredMoods) {
    return preferredMoods.has(trackMood) ? 1.0 : 0.5;
  }

  /**
   * Calculate tempo similarity
   */
  calculateTempoSimilarity(trackTempo, avgTempo) {
    const diff = Math.abs(trackTempo - avgTempo);
    return Math.max(0, 1 - (diff / 100));
  }

  /**
   * Track recommendation interaction
   */
  async trackInteraction(userId, trackId, interactionType) {
    this.logger.info(`Tracking interaction: ${userId} ${interactionType} ${trackId}`);

    switch (interactionType) {
      case 'click':
        this.recommendationMetrics.clicked++;
        break;
      case 'play':
        this.recommendationMetrics.played++;
        break;
      case 'complete':
        this.recommendationMetrics.completed++;
        break;
    }

    // Calculate rates
    if (this.recommendationMetrics.generated > 0) {
      this.recommendationMetrics.clickThroughRate =
        this.recommendationMetrics.clicked / this.recommendationMetrics.generated;
    }
    if (this.recommendationMetrics.played > 0) {
      this.recommendationMetrics.completionRate =
        this.recommendationMetrics.completed / this.recommendationMetrics.played;
    }

    return { success: true };
  }

  /**
   * Generate recommendation report
   */
  async generateReport(recommendations) {
    // Use provided results or last recommendations
    const results = recommendations || this.lastRecommendations || {
      recommendations: [],
      metadata: {}
    };

    const report = {
      title: 'BeatFlow Recommendation Report',
      generated: new Date().toISOString(),
      agent: this.agentName,
      ...results,
      metrics: this.recommendationMetrics,
      summary: {
        totalRecommendations: results.recommendations?.length || 0,
        avgScore: results.recommendations?.length > 0
          ? results.recommendations.reduce((sum, r) => sum + r.score, 0) / results.recommendations.length
          : 0,
        avgConfidence: results.recommendations?.length > 0
          ? results.recommendations.reduce((sum, r) => sum + r.confidence, 0) / results.recommendations.length
          : 0,
        diversityScore: results.metadata?.diversityScore || 0
      }
    };

    return report;
  }

  /**
   * Save recommendation report
   */
  async saveReport(results) {
    const report = await this.generateReport(results);
    const reportPath = path.join(
      this.config.projectRoot,
      'agents/reports',
      this.generateTimestampedName('recommendation-report', '.json')
    );

    try {
      await this.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.logger.success(`Recommendation report saved: ${reportPath}`);
      return reportPath;
    } catch (error) {
      this.logger.error('Failed to save recommendation report:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup and finalization
   */
  async cleanup() {
    this.logger.info('Finalizing recommendation generation...');

    // Call parent cleanup
    await super.cleanup();
  }
}

module.exports = RecommendationAgent;
