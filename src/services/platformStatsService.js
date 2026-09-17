// src/services/platformStatsService.js
// Platform Statistics Service - Real data for marketing materials
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Platform Statistics Service
 * Provides real-time platform metrics for marketing materials
 *
 * IMPORTANT: These stats are used in MarketingAgent.js and must be accurate.
 * Never fabricate or inflate numbers.
 */
class PlatformStatsService {
  constructor() {
    this.cache = null;
    this.cacheExpiry = null;
    this.cacheDuration = 1000 * 60 * 15; // 15 minutes
  }

  /**
   * Get all platform statistics (with caching)
   */
  async getAllStats() {
    // Return cached data if still valid
    if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    // Fetch fresh data
    const stats = await this.fetchAllStats();

    // Cache results
    this.cache = stats;
    this.cacheExpiry = Date.now() + this.cacheDuration;

    return stats;
  }

  /**
   * Fetch all platform statistics from Firestore
   */
  async fetchAllStats() {
    try {
      const [
        totalUsers,
        totalArtists,
        totalSongs,
        totalAlbums,
        totalPlaylists,
        totalCurators,
        totalPayout,
        totalStreams,
        activeListeners
      ] = await Promise.all([
        this.getTotalUsers(),
        this.getTotalArtists(),
        this.getTotalSongs(),
        this.getTotalAlbums(),
        this.getTotalPlaylists(),
        this.getTotalCurators(),
        this.getTotalPayout(),
        this.getTotalStreams(),
        this.getActiveListeners()
      ]);

      return {
        totalUsers,
        totalArtists,
        totalSongs,
        totalAlbums,
        totalPlaylists,
        totalCurators,
        totalPayout,
        totalStreams,
        activeListeners,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get total registered users
   */
  async getTotalUsers() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total users:', error);
      return 0;
    }
  }

  /**
   * Get total artists (users with role='artist')
   */
  async getTotalArtists() {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'artist'));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total artists:', error);
      return 0;
    }
  }

  /**
   * Get total songs uploaded
   */
  async getTotalSongs() {
    try {
      const snapshot = await getDocs(collection(db, 'songs'));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total songs:', error);
      return 0;
    }
  }

  /**
   * Get total albums
   */
  async getTotalAlbums() {
    try {
      const snapshot = await getDocs(collection(db, 'albums'));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total albums:', error);
      return 0;
    }
  }

  /**
   * Get total playlists
   */
  async getTotalPlaylists() {
    try {
      const snapshot = await getDocs(collection(db, 'playlists'));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total playlists:', error);
      return 0;
    }
  }

  /**
   * Get total curators (users with curator role or playlists)
   */
  async getTotalCurators() {
    try {
      // Count users who have created at least one playlist
      const playlistsSnapshot = await getDocs(collection(db, 'playlists'));
      const curatorIds = new Set();

      playlistsSnapshot.forEach(doc => {
        const creatorId = doc.data().createdBy || doc.data().userId;
        if (creatorId) {
          curatorIds.add(creatorId);
        }
      });

      return curatorIds.size;
    } catch (error) {
      console.error('Error getting total curators:', error);
      return 0;
    }
  }

  /**
   * Get total payout amount to artists
   * Query payouts collection and sum all amounts
   */
  async getTotalPayout() {
    try {
      const snapshot = await getDocs(collection(db, 'payouts'));
      let total = 0;

      snapshot.forEach(doc => {
        const amount = doc.data().amount || 0;
        total += amount;
      });

      // Amount is in cents, convert to dollars
      return total / 100;
    } catch (error) {
      console.error('Error getting total payout:', error);
      // Collection might not exist yet
      return 0;
    }
  }

  /**
   * Get total streams across all songs
   * Query songs collection and sum play counts
   */
  async getTotalStreams() {
    try {
      const snapshot = await getDocs(collection(db, 'songs'));
      let total = 0;

      snapshot.forEach(doc => {
        const plays = doc.data().plays || doc.data().playCount || 0;
        total += plays;
      });

      return total;
    } catch (error) {
      console.error('Error getting total streams:', error);
      return 0;
    }
  }

  /**
   * Get active listeners (users who are not artists)
   * Or users with recent activity
   */
  async getActiveListeners() {
    try {
      // Count users who are not artists
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let listenerCount = 0;

      usersSnapshot.forEach(doc => {
        const role = doc.data().role;
        if (role !== 'artist' && role !== 'admin') {
          listenerCount++;
        }
      });

      return listenerCount;
    } catch (error) {
      console.error('Error getting active listeners:', error);
      return 0;
    }
  }

  /**
   * Default stats if queries fail
   * Returns zeros instead of fake numbers
   */
  getDefaultStats() {
    return {
      totalUsers: 0,
      totalArtists: 0,
      totalSongs: 0,
      totalAlbums: 0,
      totalPlaylists: 0,
      totalCurators: 0,
      totalPayout: 0,
      totalStreams: 0,
      activeListeners: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch stats from database'
    };
  }

  /**
   * Format number for display (e.g., 1234 -> "1.2K")
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  }

  /**
   * Clear cache (for admin use or after data changes)
   */
  clearCache() {
    this.cache = null;
    this.cacheExpiry = null;
  }

  /**
   * Get formatted stats for marketing display
   */
  async getFormattedStats() {
    const raw = await this.getAllStats();

    return {
      totalUsers: this.formatNumber(raw.totalUsers),
      totalArtists: this.formatNumber(raw.totalArtists),
      totalSongs: this.formatNumber(raw.totalSongs),
      totalAlbums: this.formatNumber(raw.totalAlbums),
      totalPlaylists: this.formatNumber(raw.totalPlaylists),
      totalCurators: this.formatNumber(raw.totalCurators),
      totalPayout: this.formatCurrency(raw.totalPayout),
      totalStreams: this.formatNumber(raw.totalStreams),
      activeListeners: this.formatNumber(raw.activeListeners),
      lastUpdated: raw.lastUpdated,
      raw // Include raw numbers for reference
    };
  }
}

// Export singleton instance
export const platformStatsService = new PlatformStatsService();
export default platformStatsService;
