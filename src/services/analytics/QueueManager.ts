/**
 * Queue Manager for Analytics Events
 * Manages event buffering, priority queuing, and offline persistence
 */

import { AnalyticsEvent, AnalyticsConfig } from "./AnalyticsConfig";

export interface QueueMetrics {
  totalQueued: number;
  highPriorityQueued: number;
  normalPriorityQueued: number;
  droppedEvents: number;
  oldestEventAge: number;
  averageQueueTime: number;
}

export interface QueuedEvent {
  event: AnalyticsEvent;
  priority: "high" | "normal" | "low";
  queuedAt: number;
  retryCount: number;
  lastAttempt?: number;
}

export class QueueManager {
  private config: AnalyticsConfig;
  private highPriorityQueue: QueuedEvent[] = [];
  private normalPriorityQueue: QueuedEvent[] = [];
  private lowPriorityQueue: QueuedEvent[] = [];
  private persistenceKey = "beatflow_analytics_queue";
  private maxQueueSize = 10000;
  private maxEventAge = 48 * 60 * 60 * 1000; // 48 hours

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.loadPersistedQueue();
    this.startCleanupTimer();
    this.setupBeforeUnload();
  }

  /**
   * Add event to appropriate queue based on priority
   */
  public enqueue(
    event: AnalyticsEvent,
    priority: "high" | "normal" | "low" = "normal",
  ): boolean {
    const queuedEvent: QueuedEvent = {
      event,
      priority,
      queuedAt: Date.now(),
      retryCount: 0,
    };

    // Check total queue size
    if (this.getTotalQueueSize() >= this.maxQueueSize) {
      this.evictOldestLowPriorityEvent();
    }

    // Add to appropriate queue
    switch (priority) {
      case "high":
        this.highPriorityQueue.push(queuedEvent);
        break;
      case "normal":
        this.normalPriorityQueue.push(queuedEvent);
        break;
      case "low":
        this.lowPriorityQueue.push(queuedEvent);
        break;
    }

    this.persistQueue();
    return true;
  }

  /**
   * Dequeue events in priority order
   */
  public dequeue(count: number = 1): QueuedEvent[] {
    const events: QueuedEvent[] = [];

    // First, get high priority events
    while (events.length < count && this.highPriorityQueue.length > 0) {
      const event = this.highPriorityQueue.shift();
      if (event) events.push(event);
    }

    // Then, get normal priority events
    while (events.length < count && this.normalPriorityQueue.length > 0) {
      const event = this.normalPriorityQueue.shift();
      if (event) events.push(event);
    }

    // Finally, get low priority events
    while (events.length < count && this.lowPriorityQueue.length > 0) {
      const event = this.lowPriorityQueue.shift();
      if (event) events.push(event);
    }

    if (events.length > 0) {
      this.persistQueue();
    }

    return events;
  }

  /**
   * Peek at next events without removing them
   */
  public peek(count: number = 1): QueuedEvent[] {
    const events: QueuedEvent[] = [];

    // Collect events in priority order without removing
    const allEvents = [
      ...this.highPriorityQueue,
      ...this.normalPriorityQueue,
      ...this.lowPriorityQueue,
    ];

    return allEvents.slice(0, count);
  }

  /**
   * Re-queue failed events with backoff
   */
  public requeueFailedEvents(events: QueuedEvent[]): void {
    events.forEach((queuedEvent) => {
      queuedEvent.retryCount++;
      queuedEvent.lastAttempt = Date.now();

      // Drop events that have exceeded max retries
      if (queuedEvent.retryCount > this.config.maxRetries) {
        console.warn(
          "Dropping event after max retries:",
          queuedEvent.event.eventType,
        );
        return;
      }

      // Reduce priority of failed events
      if (queuedEvent.priority === "high" && queuedEvent.retryCount > 1) {
        queuedEvent.priority = "normal";
      } else if (
        queuedEvent.priority === "normal" &&
        queuedEvent.retryCount > 2
      ) {
        queuedEvent.priority = "low";
      }

      // Re-add to appropriate queue
      this.enqueue(queuedEvent.event, queuedEvent.priority);
    });
  }

  /**
   * Get queue metrics
   */
  public getMetrics(): QueueMetrics {
    const allEvents = [
      ...this.highPriorityQueue,
      ...this.normalPriorityQueue,
      ...this.lowPriorityQueue,
    ];

    const now = Date.now();
    const queueTimes = allEvents.map((e) => now - e.queuedAt);
    const oldestEventAge = queueTimes.length > 0 ? Math.max(...queueTimes) : 0;
    const averageQueueTime =
      queueTimes.length > 0
        ? queueTimes.reduce((sum, time) => sum + time, 0) / queueTimes.length
        : 0;

    return {
      totalQueued: this.getTotalQueueSize(),
      highPriorityQueued: this.highPriorityQueue.length,
      normalPriorityQueued: this.normalPriorityQueue.length,
      droppedEvents: 0, // Would track in real implementation
      oldestEventAge,
      averageQueueTime,
    };
  }

  /**
   * Clear all queues
   */
  public clear(): void {
    this.highPriorityQueue = [];
    this.normalPriorityQueue = [];
    this.lowPriorityQueue = [];
    this.persistQueue();
  }

  /**
   * Get total size across all queues
   */
  public getTotalQueueSize(): number {
    return (
      this.highPriorityQueue.length +
      this.normalPriorityQueue.length +
      this.lowPriorityQueue.length
    );
  }

  /**
   * Check if queue is empty
   */
  public isEmpty(): boolean {
    return this.getTotalQueueSize() === 0;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: AnalyticsConfig): void {
    this.config = config;
  }

  /**
   * Get events ready for transmission (not in retry backoff)
   */
  public getReadyEvents(count: number): QueuedEvent[] {
    const now = Date.now();
    const readyEvents: QueuedEvent[] = [];

    const checkQueue = (queue: QueuedEvent[]) => {
      return queue.filter((queuedEvent) => {
        if (readyEvents.length >= count) return false;

        // Check if event is in backoff period
        if (queuedEvent.lastAttempt) {
          const backoffDelay =
            this.config.retryDelay * Math.pow(2, queuedEvent.retryCount - 1);
          if (now - queuedEvent.lastAttempt < backoffDelay) {
            return false;
          }
        }

        readyEvents.push(queuedEvent);
        return false; // Remove from original queue
      });
    };

    // Process queues in priority order
    this.highPriorityQueue = checkQueue(this.highPriorityQueue);
    this.normalPriorityQueue = checkQueue(this.normalPriorityQueue);
    this.lowPriorityQueue = checkQueue(this.lowPriorityQueue);

    if (readyEvents.length > 0) {
      this.persistQueue();
    }

    return readyEvents;
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const now = Date.now();

    const cleanQueue = (queue: QueuedEvent[]) => {
      return queue.filter((queuedEvent) => {
        const age = now - queuedEvent.queuedAt;
        return age < this.maxEventAge;
      });
    };

    const beforeSize = this.getTotalQueueSize();

    this.highPriorityQueue = cleanQueue(this.highPriorityQueue);
    this.normalPriorityQueue = cleanQueue(this.normalPriorityQueue);
    this.lowPriorityQueue = cleanQueue(this.lowPriorityQueue);

    const afterSize = this.getTotalQueueSize();
    const cleaned = beforeSize - afterSize;

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old events from analytics queue`);
      this.persistQueue();
    }
  }

  /**
   * Evict oldest low priority event when queue is full
   */
  private evictOldestLowPriorityEvent(): void {
    if (this.lowPriorityQueue.length > 0) {
      this.lowPriorityQueue.shift();
    } else if (this.normalPriorityQueue.length > 0) {
      this.normalPriorityQueue.shift();
    }
    // Never evict high priority events
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const queueData = {
        high: this.highPriorityQueue,
        normal: this.normalPriorityQueue,
        low: this.lowPriorityQueue,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.persistenceKey, JSON.stringify(queueData));
    } catch (error) {
      console.warn("Failed to persist analytics queue:", error);
    }
  }

  /**
   * Load persisted queue from localStorage
   */
  private loadPersistedQueue(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (!stored) return;

      const queueData = JSON.parse(stored);

      // Validate stored data
      if (queueData.high && Array.isArray(queueData.high)) {
        this.highPriorityQueue = queueData.high;
      }
      if (queueData.normal && Array.isArray(queueData.normal)) {
        this.normalPriorityQueue = queueData.normal;
      }
      if (queueData.low && Array.isArray(queueData.low)) {
        this.lowPriorityQueue = queueData.low;
      }

      // Clean up old events after loading
      this.cleanupOldEvents();

      console.log(
        `Loaded ${this.getTotalQueueSize()} persisted analytics events`,
      );
    } catch (error) {
      console.warn("Failed to load persisted analytics queue:", error);
      // Clear corrupted data
      localStorage.removeItem(this.persistenceKey);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    // Clean up old events every hour
    setInterval(
      () => {
        this.cleanupOldEvents();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Setup beforeunload to persist queue
   */
  private setupBeforeUnload(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.persistQueue();
      });
    }
  }

  /**
   * Get queue status summary
   */
  public getQueueStatus(): string {
    const metrics = this.getMetrics();
    return `Queue: ${metrics.totalQueued} total (${metrics.highPriorityQueued} high, ${metrics.normalPriorityQueued} normal) | Avg age: ${Math.round(metrics.averageQueueTime / 1000)}s`;
  }
}
