import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";

/**
 * Admin Analytics Service
 * Fetches real-time platform statistics from Firestore
 */

export class AdminAnalyticsService {

  /**
   * Get total count of documents in a collection
   */
  async getCollectionCount(collectionName) {
    try {
      const coll = collection(db, collectionName);
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (error) {
      console.error(`Error counting ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Get platform overview statistics
   * OPTIMIZED: Reads from platformStats aggregate collection instead of expensive counts
   */
  async getPlatformStats() {
    try {
      // First, try to get stats from the optimized platformStats collection
      const platformStatsDoc = await getDocs(
        query(collection(db, 'platformStats'), limit(1))
      );

      if (!platformStatsDoc.empty) {
        const stats = platformStatsDoc.docs[0].data();

        // Get additional stats that aren't in platformStats yet
        const [
          totalApplications,
          pendingApplications,
          totalPlays,
          totalLikes,
          totalFollows
        ] = await Promise.all([
          this.getCollectionCount('applications'),
          this.getConditionalCount('applications', where('status', '==', 'pending')),
          this.getCollectionCount('playEvents'),
          this.getCollectionCount('likeEvents'),
          this.getCollectionCount('followEvents')
        ]);

        return {
          totalUsers: stats.totalUsers || 0,
          totalSongs: stats.totalSongs || 0,
          totalArtists: stats.totalArtists || 0,
          totalAlbums: stats.totalAlbums || 0,
          totalPlaylists: stats.totalPlaylists || 0,
          totalApplications,
          pendingApplications,
          totalPlays,
          totalLikes,
          totalFollows,
          errorRate: 0.02, // placeholder
          timestamp: Date.now(),
          lastUpdated: stats.lastUpdated?.toDate() || new Date()
        };
      }

      // Fallback to expensive counts if platformStats doesn't exist
      console.warn('platformStats collection not found, using expensive counts. Run initializePlatformStats()');

      const [
        totalUsers,
        totalSongs,
        totalArtists,
        totalAlbums,
        totalPlaylists,
        totalApplications,
        pendingApplications,
        totalPlays,
        totalLikes,
        totalFollows
      ] = await Promise.all([
        this.getCollectionCount('users'),
        this.getCollectionCount('songs'),
        this.getCollectionCount('artists'),
        this.getCollectionCount('albums'),
        this.getCollectionCount('playlists'),
        this.getCollectionCount('applications'),
        this.getConditionalCount('applications', where('status', '==', 'pending')),
        this.getCollectionCount('playEvents'),
        this.getCollectionCount('likeEvents'),
        this.getCollectionCount('followEvents')
      ]);

      return {
        totalUsers,
        totalSongs,
        totalArtists,
        totalAlbums,
        totalPlaylists,
        totalApplications,
        pendingApplications,
        totalPlays,
        totalLikes,
        totalFollows,
        errorRate: 0.02,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return null;
    }
  }

  /**
   * Get conditional count with query
   */
  async getConditionalCount(collectionName, ...queryConstraints) {
    try {
      const q = query(collection(db, collectionName), ...queryConstraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error(`Error counting ${collectionName} with conditions:`, error);
      return 0;
    }
  }

  /**
   * Get recent job applications
   */
  async getRecentApplications(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'applications'),
        orderBy('submittedAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching recent applications:', error);
      return [];
    }
  }

  /**
   * Get user activity statistics (last 24 hours)
   */
  async getUserActivity() {
    try {
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

      // Count recent analytics events
      const recentActivity = await this.getConditionalCount(
        'analytics',
        where('timestamp', '>=', oneDayAgo)
      );

      return {
        last24Hours: recentActivity,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return { last24Hours: 0, timestamp: Date.now() };
    }
  }

  /**
   * Get content upload statistics
   */
  async getContentStats() {
    try {
      const [
        totalSubmissions,
        artistSubmissions,
        pendingSubmissions
      ] = await Promise.all([
        this.getCollectionCount('artistSubmissions'),
        this.getCollectionCount('artistSubmissions'),
        this.getConditionalCount('artistSubmissions', where('status', '==', 'pending'))
      ]);

      return {
        totalSubmissions,
        artistSubmissions,
        pendingSubmissions,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching content stats:', error);
      return null;
    }
  }

  /**
   * Get security events (recent)
   */
  async getSecurityEvents(limitCount = 20) {
    try {
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

      const q = query(
        collection(db, 'analytics_events'),
        where('timestamp', '>=', oneDayAgo),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching security events:', error);
      return [];
    }
  }

  /**
   * Get all analytics data for admin dashboard
   */
  async getAllAnalytics() {
    try {
      const [
        platformStats,
        userActivity,
        contentStats,
        recentApplications,
        securityEvents
      ] = await Promise.all([
        this.getPlatformStats(),
        this.getUserActivity(),
        this.getContentStats(),
        this.getRecentApplications(5),
        this.getSecurityEvents(10)
      ]);

      return {
        platform: platformStats,
        activity: userActivity,
        content: contentStats,
        applications: recentApplications,
        security: securityEvents,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error fetching all analytics:', error);
      return null;
    }
  }

  /**
   * Get top artists by followers/streams
   */
  async getTopArtists(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'artists'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching top artists:', error);
      return [];
    }
  }

  /**
   * Get popular songs
   */
  async getPopularSongs(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'songs'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching popular songs:', error);
      return [];
    }
  }

  /**
   * ========================================
   * ENGAGEMENT METRICS FOR ML/AI ANALYSIS
   * ========================================
   */

  /**
   * Get total engagement metrics across platform
   */
  async getEngagementStats() {
    try {
      const [
        totalPlays,
        totalLikes,
        totalFollows,
        totalReviews
      ] = await Promise.all([
        this.getCollectionCount('playEvents'),
        this.getCollectionCount('likeEvents'),
        this.getCollectionCount('followEvents'),
        this.getCollectionCount('albumReviews')
      ]);

      return {
        totalPlays,
        totalLikes,
        totalFollows,
        totalReviews,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching engagement stats:', error);
      return {
        totalPlays: 0,
        totalLikes: 0,
        totalFollows: 0,
        totalReviews: 0,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get top songs by play count
   */
  async getTopSongsByPlays(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'songMetrics'),
        orderBy('playCount', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      // Get full song details for each metric
      const metricsWithSongs = await Promise.all(
        snapshot.docs.map(async (metricDoc) => {
          const songId = metricDoc.id;
          const songDoc = await getDocs(query(collection(db, 'songs'), where('__name__', '==', songId), limit(1)));

          if (!songDoc.empty) {
            return {
              ...metricDoc.data(),
              songId,
              songDetails: { id: songDoc.docs[0].id, ...songDoc.docs[0].data() }
            };
          }
          return null;
        })
      );

      return metricsWithSongs.filter(Boolean);
    } catch (error) {
      console.error('Error fetching top songs by plays:', error);
      return [];
    }
  }

  /**
   * Get top songs by like count
   */
  async getTopSongsByLikes(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'songMetrics'),
        orderBy('likeCount', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      const metricsWithSongs = await Promise.all(
        snapshot.docs.map(async (metricDoc) => {
          const songId = metricDoc.id;
          const songDoc = await getDocs(query(collection(db, 'songs'), where('__name__', '==', songId), limit(1)));

          if (!songDoc.empty) {
            return {
              ...metricDoc.data(),
              songId,
              songDetails: { id: songDoc.docs[0].id, ...songDoc.docs[0].data() }
            };
          }
          return null;
        })
      );

      return metricsWithSongs.filter(Boolean);
    } catch (error) {
      console.error('Error fetching top songs by likes:', error);
      return [];
    }
  }

  /**
   * Get top artists by follower count
   */
  async getTopArtistsByFollowers(limitCount = 10) {
    try {
      const q = query(
        collection(db, 'artistMetrics'),
        orderBy('followerCount', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        artistId: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching top artists by followers:', error);
      return [];
    }
  }

  /**
   * Get recent engagement activity (last 24 hours)
   */
  async getRecentEngagement(limitCount = 50) {
    try {
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

      const [plays, likes, follows] = await Promise.all([
        getDocs(query(
          collection(db, 'playEvents'),
          where('timestamp', '>=', oneDayAgo),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        )),
        getDocs(query(
          collection(db, 'likeEvents'),
          where('timestamp', '>=', oneDayAgo),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        )),
        getDocs(query(
          collection(db, 'followEvents'),
          where('timestamp', '>=', oneDayAgo),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        ))
      ]);

      return {
        plays: plays.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        likes: likes.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        follows: follows.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching recent engagement:', error);
      return { plays: [], likes: [], follows: [], timestamp: Date.now() };
    }
  }

  /**
   * Get engagement trends (last 7 days)
   */
  async getEngagementTrends() {
    try {
      const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      const [playsCount, likesCount, followsCount] = await Promise.all([
        this.getConditionalCount('playEvents', where('timestamp', '>=', sevenDaysAgo)),
        this.getConditionalCount('likeEvents', where('timestamp', '>=', sevenDaysAgo)),
        this.getConditionalCount('followEvents', where('timestamp', '>=', sevenDaysAgo))
      ]);

      return {
        last7Days: {
          plays: playsCount,
          likes: likesCount,
          follows: followsCount
        },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching engagement trends:', error);
      return {
        last7Days: { plays: 0, likes: 0, follows: 0 },
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get comprehensive analytics for ML/AI dashboard
   */
  async getMLAnalytics() {
    try {
      const [
        engagementStats,
        topSongsByPlays,
        topSongsByLikes,
        topArtists,
        recentActivity,
        trends
      ] = await Promise.all([
        this.getEngagementStats(),
        this.getTopSongsByPlays(10),
        this.getTopSongsByLikes(10),
        this.getTopArtistsByFollowers(10),
        this.getRecentEngagement(20),
        this.getEngagementTrends()
      ]);

      return {
        engagement: engagementStats,
        topSongs: {
          byPlays: topSongsByPlays,
          byLikes: topSongsByLikes
        },
        topArtists,
        recentActivity,
        trends,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error fetching ML analytics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const adminAnalytics = new AdminAnalyticsService();
