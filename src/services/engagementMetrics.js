/**
 * Engagement Metrics Service
 * Tracks and aggregates user engagement data for ML/AI analysis and analytics
 */

import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

/**
 * Track a song play event
 * Stores both aggregate counts and individual events for ML analysis
 */
export const trackPlay = async (userId, songId, metadata = {}) => {
  try {
    const playEvent = {
      userId,
      songId,
      timestamp: serverTimestamp(),
      duration: metadata.duration || 0,
      completionRate: metadata.completionRate || 0,
      source: metadata.source || 'web', // web, mobile, etc.
      context: metadata.context || 'browse' // browse, playlist, search, album, etc.
    };

    // Store individual play event for ML analysis
    await setDoc(doc(collection(db, 'playEvents')), playEvent);

    // Update aggregate song metrics
    const songMetricsRef = doc(db, 'songMetrics', songId);
    await setDoc(songMetricsRef, {
      playCount: increment(1),
      lastPlayed: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update user listening history count
    const userMetricsRef = doc(db, 'userMetrics', userId);
    await setDoc(userMetricsRef, {
      totalPlays: increment(1),
      lastActive: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Error tracking play:', error);
  }
};

/**
 * Track a like event
 */
export const trackLike = async (userId, itemId, itemType = 'song') => {
  try {
    const likeEvent = {
      userId,
      itemId,
      itemType,
      timestamp: serverTimestamp(),
      action: 'like'
    };

    // Store individual like event
    await setDoc(doc(collection(db, 'likeEvents')), likeEvent);

    // Update aggregate metrics
    const metricsRef = doc(db, `${itemType}Metrics`, itemId);
    await setDoc(metricsRef, {
      likeCount: increment(1),
      lastLiked: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Error tracking like:', error);
  }
};

/**
 * Track an unlike event
 */
export const trackUnlike = async (userId, itemId, itemType = 'song') => {
  try {
    const unlikeEvent = {
      userId,
      itemId,
      itemType,
      timestamp: serverTimestamp(),
      action: 'unlike'
    };

    // Store individual unlike event
    await setDoc(doc(collection(db, 'likeEvents')), unlikeEvent);

    // Update aggregate metrics
    const metricsRef = doc(db, `${itemType}Metrics`, itemId);
    await setDoc(metricsRef, {
      likeCount: increment(-1),
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Error tracking unlike:', error);
  }
};

/**
 * Track an artist follow event
 */
export const trackFollow = async (userId, artistId, artistName) => {
  try {
    const followEvent = {
      userId,
      artistId,
      artistName,
      timestamp: serverTimestamp(),
      action: 'follow'
    };

    // Store individual follow event
    await setDoc(doc(collection(db, 'followEvents')), followEvent);

    // Update artist metrics
    const artistMetricsRef = doc(db, 'artistMetrics', artistId);
    await setDoc(artistMetricsRef, {
      followerCount: increment(1),
      lastFollowed: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Error tracking follow:', error);
  }
};

/**
 * Track an artist unfollow event
 */
export const trackUnfollow = async (userId, artistId, artistName) => {
  try {
    const unfollowEvent = {
      userId,
      artistId,
      artistName,
      timestamp: serverTimestamp(),
      action: 'unfollow'
    };

    // Store individual unfollow event
    await setDoc(doc(collection(db, 'followEvents')), unfollowEvent);

    // Update artist metrics
    const artistMetricsRef = doc(db, 'artistMetrics', artistId);
    await setDoc(artistMetricsRef, {
      followerCount: increment(-1),
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Error tracking unfollow:', error);
  }
};

/**
 * Get engagement metrics for a song
 */
export const getSongMetrics = async (songId) => {
  try {
    const metricsRef = doc(db, 'songMetrics', songId);
    const metricsSnap = await getDoc(metricsRef);

    if (metricsSnap.exists()) {
      return metricsSnap.data();
    }

    return {
      playCount: 0,
      likeCount: 0
    };
  } catch (error) {
    console.error('Error getting song metrics:', error);
    return { playCount: 0, likeCount: 0 };
  }
};

/**
 * Get engagement metrics for an album
 */
export const getAlbumMetrics = async (albumId) => {
  try {
    const metricsRef = doc(db, 'albumMetrics', albumId);
    const metricsSnap = await getDoc(metricsRef);

    if (metricsSnap.exists()) {
      return metricsSnap.data();
    }

    return {
      playCount: 0,
      likeCount: 0
    };
  } catch (error) {
    console.error('Error getting album metrics:', error);
    return { playCount: 0, likeCount: 0 };
  }
};

/**
 * Get engagement metrics for an artist
 */
export const getArtistMetrics = async (artistId) => {
  try {
    const metricsRef = doc(db, 'artistMetrics', artistId);
    const metricsSnap = await getDoc(metricsRef);

    if (metricsSnap.exists()) {
      return metricsSnap.data();
    }

    return {
      followerCount: 0,
      totalPlays: 0,
      activeListeners: 0
    };
  } catch (error) {
    console.error('Error getting artist metrics:', error);
    return { followerCount: 0, totalPlays: 0, activeListeners: 0 };
  }
};

/**
 * Subscribe to real-time song metrics updates
 */
export const subscribeSongMetrics = (songId, callback) => {
  const metricsRef = doc(db, 'songMetrics', songId);

  return onSnapshot(metricsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ playCount: 0, likeCount: 0 });
    }
  }, (error) => {
    console.error('Error subscribing to song metrics:', error);
    callback({ playCount: 0, likeCount: 0 });
  });
};

/**
 * Subscribe to real-time artist metrics updates
 */
export const subscribeArtistMetrics = (artistId, callback) => {
  const metricsRef = doc(db, 'artistMetrics', artistId);

  return onSnapshot(metricsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ followerCount: 0, totalPlays: 0 });
    }
  }, (error) => {
    console.error('Error subscribing to artist metrics:', error);
    callback({ followerCount: 0, totalPlays: 0 });
  });
};

/**
 * Calculate active listeners for an artist (last 30 days)
 */
export const getActiveListeners = async (artistId) => {
  try {
    // Get all songs by artist
    const songsQuery = query(
      collection(db, 'songs'),
      where('artistId', '==', artistId)
    );
    const songsSnap = await getDocs(songsQuery);
    const songIds = songsSnap.docs.map(doc => doc.id);

    if (songIds.length === 0) return 0;

    // Get unique users who played artist's songs in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const playsQuery = query(
      collection(db, 'playEvents'),
      where('songId', 'in', songIds.slice(0, 10)) // Firestore limit
    );

    const playsSnap = await getDocs(playsQuery);
    const uniqueListeners = new Set(
      playsSnap.docs
        .filter(doc => doc.data().timestamp?.toDate() > thirtyDaysAgo)
        .map(doc => doc.data().userId)
    );

    return uniqueListeners.size;
  } catch (error) {
    console.error('Error calculating active listeners:', error);
    return 0;
  }
};

/**
 * Batch update metrics (for migration or corrections)
 */
export const recalculateMetrics = async (itemId, itemType = 'song') => {
  try {
    // This would be called from admin panel to recalculate metrics
    // Useful for data migrations or fixing discrepancies

    if (itemType === 'song') {
      // Count actual likes
      const likesQuery = query(
        collection(db, 'songLikes'),
        where('songId', '==', itemId)
      );
      const likesSnap = await getDocs(likesQuery);
      const likeCount = likesSnap.size;

      // Update metrics
      const metricsRef = doc(db, 'songMetrics', itemId);
      await setDoc(metricsRef, {
        likeCount,
        recalculatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true, likeCount };
    }

    // Similar logic for albums and artists...

  } catch (error) {
    console.error('Error recalculating metrics:', error);
    return { success: false, error: error.message };
  }
};
