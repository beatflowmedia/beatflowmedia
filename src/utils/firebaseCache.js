/**
 * Firebase Query Cache Utility
 * Caches Firestore query results to reduce repeated queries and improve performance
 */

class FirebaseCache {
  constructor(ttl = 5 * 60 * 1000) { // Default 5 minutes TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Generate cache key from query parameters
   */
  generateKey(collection, filters = {}) {
    const filterStr = JSON.stringify(filters);
    return `${collection}:${filterStr}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Store data in cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear specific cache entry
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

// Create singleton instance
const firebaseCache = new FirebaseCache();

export default firebaseCache;
