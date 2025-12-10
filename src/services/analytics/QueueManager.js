// src/services/analytics/QueueManager.js
// Queue management for offline events and priority-based processing

export class QueueManager {
  constructor() {
    this.queues = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };

    this.offlineQueue = [];
    this.offlineMode = false;
    this.offlineStartTime = null;

    this.storage = {
      enabled: typeof localStorage !== "undefined",
      key: "analytics_queue"
    };

    this.retryPolicy = {
      maxRetries: 3,
      baseDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000
    };

    this.initialize();
  }

  /**
   * Initialize queue manager
   */
  initialize() {
    this.loadPersistedQueue();
    this.setupStorageSync();
    this.startProcessing();
  }

  /**
   * Add event to priority queue
   */
  enqueue(event, priority = "normal") {
    if (!this.queues[priority]) {
      priority = "normal";
    }

    const queuedEvent = {
      ...event,
      queued_at: Date.now(),
      priority,
      retry_count: 0,
      id: this.generateQueueId()
    };

    if (this.offlineMode) {
      this.offlineQueue.push(queuedEvent);
    } else {
      this.queues[priority].push(queuedEvent);
    }

    this.persistQueue();
    return queuedEvent.id;
  }

  /**
   * Dequeue events by priority
   */
  dequeue(priority = null, maxCount = 10) {
    if (priority) {
      return this.dequeueFromPriority(priority, maxCount);
    }

    // Dequeue from all priorities in order
    const events = [];
    const priorities = ["critical", "high", "normal", "low"];

    for (const p of priorities) {
      const remaining = maxCount - events.length;
      if (remaining <= 0) break;

      const priorityEvents = this.dequeueFromPriority(p, remaining);
      events.push(...priorityEvents);
    }

    return events;
  }

  /**
   * Dequeue from specific priority queue
   */
  dequeueFromPriority(priority, maxCount) {
    const queue = this.queues[priority] || [];
    const events = queue.splice(0, maxCount);
    this.persistQueue();
    return events;
  }

  /**
   * Get queue sizes
   */
  getQueueSizes() {
    return {
      critical: this.queues.critical.length,
      high: this.queues.high.length,
      normal: this.queues.normal.length,
      low: this.queues.low.length,
      offline: this.offlineQueue.length,
      total: this.getTotalQueueSize()
    };
  }

  /**
   * Get total queue size across all priorities
   */
  getTotalQueueSize() {
    return (
      Object.values(this.queues).reduce(
        (total, queue) => total + queue.length,
        0,
      ) + this.offlineQueue.length
    );
  }

  /**
   * Enable offline mode
   */
  enableOfflineMode() {
    if (!this.offlineMode) {
      this.offlineMode = true;
      this.offlineStartTime = Date.now();
      console.log("Analytics queue: Offline mode enabled");
    }
  }

  /**
   * Disable offline mode and return queued events
   */
  disableOfflineMode() {
    if (this.offlineMode) {
      this.offlineMode = false;
      console.log("Analytics queue: Offline mode disabled");
      return this.processOfflineQueue();
    }
    return Promise.resolve([]);
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue() {
    const events = [...this.offlineQueue];
    this.offlineQueue = [];

    // Merge offline events into priority queues
    events.forEach((event) => {
      this.queues[event.priority].push(event);
    });

    this.persistQueue();
    return events;
  }

  /**
   * Get offline duration
   */
  getOfflineDuration() {
    if (!this.offlineStartTime) return 0;
    return Date.now() - this.offlineStartTime;
  }

  /**
   * Retry failed event
   */
  retryEvent(event, error) {
    if (event.retry_count >= this.retryPolicy.maxRetries) {
      console.warn("Event max retries exceeded:", event.id);
      this.handlePermanentFailure(event, error);
      return false;
    }

    event.retry_count++;
    event.last_error = {
      message: error.message,
      timestamp: Date.now()
    };

    // Calculate retry delay with exponential backoff
    const delay = Math.min(
      this.retryPolicy.baseDelay *
        Math.pow(this.retryPolicy.backoffMultiplier, event.retry_count - 1),
      this.retryPolicy.maxDelay,
    );

    // Schedule retry
    setTimeout(() => {
      this.enqueue(event, event.priority);
    }, delay);

    return true;
  }

  /**
   * Handle permanent event failure
   */
  handlePermanentFailure(event, error) {
    const failureRecord = {
      event_id: event.id,
      original_event: event,
      failure_reason: error.message,
      retry_count: event.retry_count,
      failed_at: Date.now()
    };

    // Store failure for debugging
    this.persistFailure(failureRecord);

    // Emit failure event for monitoring
    this.emitFailureEvent(failureRecord);
  }

  /**
   * Clear specific queue
   */
  clearQueue(priority) {
    if (priority === "offline") {
      this.offlineQueue = [];
    } else if (this.queues[priority]) {
      this.queues[priority] = [];
    }
    this.persistQueue();
  }

  /**
   * Clear all queues
   */
  clearAllQueues() {
    Object.keys(this.queues).forEach((priority) => {
      this.queues[priority] = [];
    });
    this.offlineQueue = [];
    this.persistQueue();
  }

  /**
   * Get events by priority
   */
  getEventsByPriority(priority) {
    if (priority === "offline") {
      return [...this.offlineQueue];
    }
    return this.queues[priority] ? [...this.queues[priority]] : [];
  }

  /**
   * Get oldest events across all queues
   */
  getOldestEvents(maxCount = 10) {
    const allEvents = [
      ...this.queues.critical,
      ...this.queues.high,
      ...this.queues.normal,
      ...this.queues.low,
      ...this.offlineQueue,
    ];

    return allEvents
      .sort((a, b) => a.queued_at - b.queued_at)
      .slice(0, maxCount);
  }

  /**
   * Remove event by ID
   */
  removeEvent(eventId) {
    let removed = false;

    // Check all priority queues
    Object.keys(this.queues).forEach((priority) => {
      const index = this.queues[priority].findIndex(
        (event) => event.id === eventId,
      );
      if (index !== -1) {
        this.queues[priority].splice(index, 1);
        removed = true;
      }
    });

    // Check offline queue
    const offlineIndex = this.offlineQueue.findIndex(
      (event) => event.id === eventId,
    );
    if (offlineIndex !== -1) {
      this.offlineQueue.splice(offlineIndex, 1);
      removed = true;
    }

    if (removed) {
      this.persistQueue();
    }

    return removed;
  }

  /**
   * Start queue processing
   */
  startProcessing() {
    // Process queues periodically
    setInterval(() => {
      this.processExpiredEvents();
    }, 60000); // Every minute

    // Process high-priority events more frequently
    setInterval(() => {
      this.processCriticalEvents();
    }, 5000); // Every 5 seconds
  }

  /**
   * Process expired events (stuck in queue too long)
   */
  processExpiredEvents() {
    const maxAge = 300000; // 5 minutes
    const now = Date.now();

    Object.keys(this.queues).forEach((priority) => {
      const expiredEvents = this.queues[priority].filter(
        (event) => now - event.queued_at > maxAge,
      );

      if (expiredEvents.length > 0) {
        console.warn(
          `Found ${expiredEvents.length} expired events in ${priority} queue`,
        );
        // Remove expired events or handle them appropriately
        this.queues[priority] = this.queues[priority].filter(
          (event) => now - event.queued_at <= maxAge,
        );
      }
    });
  }

  /**
   * Process critical events immediately
   */
  processCriticalEvents() {
    const criticalEvents = this.queues.critical;
    if (criticalEvents.length > 0) {
      console.log(`Processing ${criticalEvents.length} critical events`);
      // Trigger immediate processing
      this.emitProcessingEvent("critical", criticalEvents.length);
    }
  }

  /**
   * Persist queue to storage
   */
  persistQueue() {
    if (!this.storage.enabled) return;

    try {
      const queueData = {
        queues: this.queues,
        offlineQueue: this.offlineQueue,
        offlineMode: this.offlineMode,
        offlineStartTime: this.offlineStartTime,
        timestamp: Date.now()
      };

      localStorage.setItem(this.storage.key, JSON.stringify(queueData));
    } catch (error) {
      console.warn("Failed to persist queue:", error);
    }
  }

  /**
   * Load persisted queue from storage
   */
  loadPersistedQueue() {
    if (!this.storage.enabled) return;

    try {
      const stored = localStorage.getItem(this.storage.key);
      if (stored) {
        const queueData = JSON.parse(stored);

        // Restore queue state
        this.queues = queueData.queues || this.queues;
        this.offlineQueue = queueData.offlineQueue || [];
        this.offlineMode = queueData.offlineMode || false;
        this.offlineStartTime = queueData.offlineStartTime;

        console.log("Queue state restored from storage");
      }
    } catch (error) {
      console.warn("Failed to load persisted queue:", error);
    }
  }

  /**
   * Setup storage synchronization
   */
  setupStorageSync() {
    // Sync queue state periodically
    setInterval(() => {
      this.persistQueue();
    }, 30000); // Every 30 seconds

    // Persist on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.persistQueue();
      });
    }
  }

  /**
   * Persist failure record
   */
  persistFailure(failureRecord) {
    if (!this.storage.enabled) return;

    try {
      const key = "analytics_failures";
      const stored = localStorage.getItem(key);
      const failures = stored ? JSON.parse(stored) : [];

      failures.push(failureRecord);

      // Keep only last 100 failures
      if (failures.length > 100) {
        failures.splice(0, failures.length - 100);
      }

      localStorage.setItem(key, JSON.stringify(failures));
    } catch (error) {
      console.warn("Failed to persist failure:", error);
    }
  }

  /**
   * Get failure history
   */
  getFailureHistory() {
    if (!this.storage.enabled) return [];

    try {
      const stored = localStorage.getItem("analytics_failures");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to load failure history:", error);
      return [];
    }
  }

  /**
   * Emit processing event for monitoring
   */
  emitProcessingEvent(priority, eventCount) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("analytics-queue-processing", {
        detail: { priority, eventCount, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Emit failure event for monitoring
   */
  emitFailureEvent(failureRecord) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("analytics-queue-failure", {
        detail: failureRecord
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Generate unique queue ID
   */
  generateQueueId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStatistics() {
    const sizes = this.getQueueSizes();
    const failures = this.getFailureHistory();
    const oldestEvents = this.getOldestEvents(1);

    return {
      queue_sizes: sizes,
      offline_mode: this.offlineMode,
      offline_duration: this.getOfflineDuration(),
      total_events: sizes.total,
      failure_count: failures.length,
      oldest_event_age:
        oldestEvents.length > 0 ? Date.now() - oldestEvents[0].queued_at : 0,
      last_persistence: this.lastPersistenceTime || 0
    };
  }

  /**
   * Optimize queue performance
   */
  optimizeQueues() {
    // Remove duplicate events
    this.removeDuplicateEvents();

    // Compact queues
    this.compactQueues();

    // Clean up old failures
    this.cleanupFailures();
  }

  /**
   * Remove duplicate events from queues
   */
  removeDuplicateEvents() {
    Object.keys(this.queues).forEach((priority) => {
      const seen = new Set();
      this.queues[priority] = this.queues[priority].filter((event) => {
        const key = `${event.event_name}_${event.user_id}_${event.timestamp}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    });

    // Same for offline queue
    const offlineSeen = new Set();
    this.offlineQueue = this.offlineQueue.filter((event) => {
      const key = `${event.event_name}_${event.user_id}_${event.timestamp}`;
      if (offlineSeen.has(key)) {
        return false;
      }
      offlineSeen.add(key);
      return true;
    });
  }

  /**
   * Compact queues by removing old, failed events
   */
  compactQueues() {
    const maxAge = 3600000; // 1 hour
    const now = Date.now();

    Object.keys(this.queues).forEach((priority) => {
      this.queues[priority] = this.queues[priority].filter(
        (event) => now - event.queued_at < maxAge || event.retry_count === 0,
      );
    });
  }

  /**
   * Clean up old failure records
   */
  cleanupFailures() {
    if (!this.storage.enabled) return;

    try {
      const failures = this.getFailureHistory();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const now = Date.now();

      const cleanFailures = failures.filter(
        (failure) => now - failure.failed_at < maxAge,
      );

      localStorage.setItem("analytics_failures", JSON.stringify(cleanFailures));
    } catch (error) {
      console.warn("Failed to cleanup failures:", error);
    }
  }

  /**
   * Reset queue manager
   */
  reset() {
    this.clearAllQueues();
    this.offlineMode = false;
    this.offlineStartTime = null;

    if (this.storage.enabled) {
      localStorage.removeItem(this.storage.key);
      localStorage.removeItem("analytics_failures");
    }
  }

  /**
   * Destroy queue manager
   */
  destroy() {
    this.persistQueue();
    // Clean up any intervals or event listeners
    console.log("QueueManager destroyed");
  }
}
