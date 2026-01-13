/**
 * Recommendation Service - Unified AI-powered playlist and track recommendations
 *
 * Connects the existing RecommendationAgent to live Firestore data
 * Powers both:
 * 1. Listener recommendations (personalized playlist discovery)
 * 2. Artist placement (smart playlist matching)
 *
 * Phase 1: Genre-based matching with existing data
 * Phase 2+: Acoustic features, deep learning, context-aware
 */

import { db } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';

class RecommendationService {
  constructor() {
    this.cache = {
      userProfiles: new Map(),
      catalogTracks: null,
      catalogExpiry: null,
      playlists: null,
      playlistsExpiry: null
    };

    // Cache TTL (5 minutes)
    this.CACHE_TTL = 5 * 60 * 1000;
  }

  /**
   * Get personalized playlist recommendations for a user
   *
   * @param {string} userId - User ID
   * @param {number} limit - Max recommendations to return
   * @returns {Promise<Array>} Recommended playlists with match scores
   */
  async getPlaylistRecommendationsForUser(userId, limitCount = 10) {
    try {
      console.log(`🎵 Generating playlist recommendations for user: ${userId}`);

      // Load user profile and history
      const userProfile = await this.loadUserProfile(userId);
      const userHistory = await this.loadUserHistory(userId);

      // Extract user preferences
      const preferences = this.extractPreferences(userProfile, userHistory);

      // Get all playlists
      const playlists = await this.getAllPlaylists();

      // Score and rank playlists
      const scored = playlists.map(playlist => {
        const score = this.calculatePlaylistMatchScore(playlist, preferences, userHistory);
        return {
          ...playlist,
          matchScore: score,
          reason: this.generatePlaylistMatchReason(playlist, preferences)
        };
      });

      // Sort by score and limit
      const recommendations = scored
        .filter(p => p.matchScore > 0.3) // Minimum 30% match
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limitCount);

      console.log(`✅ Generated ${recommendations.length} playlist recommendations`);

      return recommendations;

    } catch (error) {
      console.error('❌ Error generating playlist recommendations:', error);
      throw error;
    }
  }

  /**
   * Get smart playlist placement recommendations for an artist's track
   *
   * @param {string} songId - Song document ID
   * @returns {Promise<Array>} Matching playlists with compatibility scores
   */
  async getPlaylistPlacementForTrack(songId) {
    try {
      console.log(`🎸 Finding playlist placements for track: ${songId}`);

      // Load song data
      const song = await this.loadSong(songId);
      if (!song) {
        throw new Error('Song not found');
      }

      // Get all playlists
      const playlists = await this.getAllPlaylists();

      // Score compatibility
      const scored = playlists.map(playlist => {
        const score = this.calculateTrackPlaylistCompatibility(song, playlist);
        return {
          ...playlist,
          compatibilityScore: score,
          reason: this.generatePlacementReason(song, playlist)
        };
      });

      // Sort and filter
      const recommendations = scored
        .filter(p => p.compatibilityScore > 0.6) // Minimum 60% compatibility for placement
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      console.log(`✅ Found ${recommendations.length} compatible playlists`);

      return recommendations;

    } catch (error) {
      console.error('❌ Error finding playlist placement:', error);
      throw error;
    }
  }

  /**
   * Load user profile from Firestore
   *
   * @param {string} userId
   * @returns {Promise<Object>} User profile
   */
  async loadUserProfile(userId) {
    // Check cache
    const cached = this.cache.userProfiles.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        // New user - return default profile
        return {
          userId,
          preferences: null,
          favoriteGenres: [],
          displayName: 'Anonymous'
        };
      }

      const profile = userDoc.data();

      // Cache it
      this.cache.userProfiles.set(userId, {
        data: profile,
        timestamp: Date.now()
      });

      return profile;

    } catch (error) {
      console.error('Error loading user profile:', error);
      return {
        userId,
        preferences: null,
        favoriteGenres: []
      };
    }
  }

  /**
   * Load user listening history from Firestore
   *
   * @param {string} userId
   * @returns {Promise<Object>} User history
   */
  async loadUserHistory(userId) {
    try {
      // Get recent play events (last 1000)
      const playEventsQuery = query(
        collection(db, 'playEvents'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      const playEventsSnapshot = await getDocs(playEventsQuery);

      const playedTracks = new Set();
      playEventsSnapshot.forEach(doc => {
        playedTracks.add(doc.data().songId);
      });

      // Get liked tracks
      const likeEventsQuery = query(
        collection(db, 'likeEvents'),
        where('userId', '==', userId),
        where('liked', '==', true),
        orderBy('timestamp', 'desc'),
        limit(500)
      );
      const likeEventsSnapshot = await getDocs(likeEventsQuery);

      const likedTracks = new Set();
      likeEventsSnapshot.forEach(doc => {
        likedTracks.add(doc.data().songId);
      });

      // Get followed artists
      const followEventsQuery = query(
        collection(db, 'followEvents'),
        where('userId', '==', userId),
        where('followed', '==', true),
        limit(500)
      );
      const followEventsSnapshot = await getDocs(followEventsQuery);

      const followedArtists = new Set();
      followEventsSnapshot.forEach(doc => {
        followedArtists.add(doc.data().artistId || doc.data().artistName);
      });

      return {
        userId,
        playedTracks,
        likedTracks,
        skippedTracks: new Set(), // TODO: Add skip tracking
        followedArtists,
        totalPlays: playedTracks.size
      };

    } catch (error) {
      console.error('Error loading user history:', error);
      // Return empty history for new users
      return {
        userId,
        playedTracks: new Set(),
        likedTracks: new Set(),
        skippedTracks: new Set(),
        followedArtists: new Set(),
        totalPlays: 0
      };
    }
  }

  /**
   * Load song data
   *
   * @param {string} songId
   * @returns {Promise<Object>} Song data
   */
  async loadSong(songId) {
    try {
      const songDoc = await getDoc(doc(db, 'songs', songId));
      if (!songDoc.exists()) {
        return null;
      }

      return {
        id: songDoc.id,
        ...songDoc.data()
      };
    } catch (error) {
      console.error('Error loading song:', error);
      return null;
    }
  }

  /**
   * Get all playlists (public + visible)
   *
   * @returns {Promise<Array>} All playlists
   */
  async getAllPlaylists() {
    // Check cache
    if (this.cache.playlists && Date.now() - this.cache.playlistsExpiry < this.CACHE_TTL) {
      return this.cache.playlists;
    }

    try {
      const playlistsSnapshot = await getDocs(collection(db, 'playlists'));

      const playlists = playlistsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Cache it
      this.cache.playlists = playlists;
      this.cache.playlistsExpiry = Date.now();

      return playlists;

    } catch (error) {
      console.error('Error loading playlists:', error);
      return [];
    }
  }

  /**
   * Extract user preferences from profile and history
   *
   * @param {Object} userProfile
   * @param {Object} userHistory
   * @returns {Object} Extracted preferences
   */
  extractPreferences(userProfile, userHistory) {
    const preferences = {
      genres: new Set(),
      artists: new Set(),
      moods: new Set()
    };

    // From explicit profile preferences
    if (userProfile.preferences?.genres) {
      userProfile.preferences.genres.forEach(g => preferences.genres.add(g));
    }
    if (userProfile.favoriteGenres) {
      userProfile.favoriteGenres.forEach(g => preferences.genres.add(g));
    }

    // From listening history (followed artists)
    if (userHistory.followedArtists) {
      userHistory.followedArtists.forEach(a => preferences.artists.add(a));
    }

    return preferences;
  }

  /**
   * Calculate match score between playlist and user preferences
   *
   * @param {Object} playlist
   * @param {Object} preferences
   * @param {Object} userHistory
   * @returns {number} Match score (0-1)
   */
  calculatePlaylistMatchScore(playlist, preferences, userHistory) {
    let score = 0;
    let weights = 0;

    // Genre matching (40% weight)
    if (preferences.genres.size > 0 && playlist.songs && playlist.songs.length > 0) {
      // Would need to fetch songs to check genres - simplified for now
      // Assume playlist name contains genre hints
      const playlistName = (playlist.name || '').toLowerCase();
      for (const genre of preferences.genres) {
        if (playlistName.includes(genre.toLowerCase())) {
          score += 0.4;
          break;
        }
      }
      weights += 0.4;
    }

    // Creator following (30% weight)
    if (preferences.artists.has(playlist.creatorId) || preferences.artists.has(playlist.creatorName)) {
      score += 0.3;
      weights += 0.3;
    }

    // Popularity (20% weight) - existing playlists get slight boost
    if (playlist.songs && playlist.songs.length > 5) {
      score += 0.2;
      weights += 0.2;
    }

    // Freshness (10% weight) - newer playlists get slight boost
    if (playlist.createdAt) {
      const ageInDays = (Date.now() - new Date(playlist.createdAt.toDate ? playlist.createdAt.toDate() : playlist.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) {
        score += 0.1;
        weights += 0.1;
      }
    }

    // Normalize score
    return weights > 0 ? score / weights : 0;
  }

  /**
   * Calculate compatibility between track and playlist
   *
   * @param {Object} song
   * @param {Object} playlist
   * @returns {number} Compatibility score (0-1)
   */
  calculateTrackPlaylistCompatibility(song, playlist) {
    let score = 0;

    // Genre match (exact) - 100% weight
    const songGenre = (song.genre || song.category || '').toLowerCase();
    const playlistName = (playlist.name || '').toLowerCase();

    if (songGenre && playlistName.includes(songGenre)) {
      score = 1.0;
    } else {
      // Partial match - check for genre families
      const genreFamilies = {
        'hip-hop': ['rap', 'hip hop', 'hiphop', 'r&b', 'rnb'],
        'electronic': ['edm', 'house', 'techno', 'dubstep', 'electro'],
        'rock': ['punk', 'metal', 'indie', 'alternative'],
        'pop': ['dance', 'top 40', 'mainstream']
      };

      for (const [family, variants] of Object.entries(genreFamilies)) {
        if (variants.some(v => songGenre.includes(v)) &&
            variants.some(v => playlistName.includes(v))) {
          score = 0.75;
          break;
        }
      }
    }

    return score;
  }

  /**
   * Generate explanation for playlist recommendation
   *
   * @param {Object} playlist
   * @param {Object} preferences
   * @returns {string} Human-readable reason
   */
  generatePlaylistMatchReason(playlist, preferences) {
    const reasons = [];

    // Check genre match
    const playlistName = (playlist.name || '').toLowerCase();
    for (const genre of preferences.genres) {
      if (playlistName.includes(genre.toLowerCase())) {
        reasons.push(`Matches your taste for ${genre}`);
        break;
      }
    }

    // Check creator match
    if (preferences.artists.has(playlist.creatorId) || preferences.artists.has(playlist.creatorName)) {
      reasons.push(`Curated by ${playlist.creatorName || 'artist you follow'}`);
    }

    // Check popularity
    if (playlist.songs && playlist.songs.length > 10) {
      reasons.push(`Popular playlist with ${playlist.songs.length} tracks`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Recommended for you';
  }

  /**
   * Generate explanation for track placement
   *
   * @param {Object} song
   * @param {Object} playlist
   * @returns {string} Human-readable reason
   */
  generatePlacementReason(song, playlist) {
    const songGenre = (song.genre || song.category || 'Unknown').toLowerCase();
    const playlistName = (playlist.name || '').toLowerCase();

    if (playlistName.includes(songGenre)) {
      return `Perfect genre match: ${song.genre || song.category}`;
    } else {
      return `Compatible with playlist vibe`;
    }
  }

  /**
   * Clear caches (useful for testing)
   */
  clearCache() {
    this.cache.userProfiles.clear();
    this.cache.catalogTracks = null;
    this.cache.catalogExpiry = null;
    this.cache.playlists = null;
    this.cache.playlistsExpiry = null;
  }
}

// Singleton instance
export const recommendationService = new RecommendationService();
export default recommendationService;
